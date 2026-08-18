import React, { useState, useEffect, useRef } from 'react';
import aiLogic from '../utils/aiLogic';
import soundEffects from '../utils/soundEffects';

const COLORS = [
  { name: 'Red',    hex: '#ff4444', light: 'rgba(255,68,68,0.1)'    },
  { name: 'Blue',   hex: '#00d4ff', light: 'rgba(0,212,255,0.1)'    },
  { name: 'Green',  hex: '#00ff88', light: 'rgba(0,255,136,0.1)'    },
  { name: 'Purple', hex: '#bf00ff', light: 'rgba(191,0,255,0.1)'    },
];

const RULES = [
  { id: 'color',    label: 'Pick the INK COLOR',   desc: 'What color is the text written in?',                    color: '#00d4ff' },
  { id: 'word',     label: 'Pick the WORD',         desc: 'What does the word say? (ignore ink color)',            color: '#00ff88' },
  { id: 'opposite', label: 'Pick the OPPOSITE',     desc: 'Pick a color that is NEITHER the ink NOR the word!',   color: '#bf00ff' },
  { id: 'both',     label: 'INK matches WORD?',     desc: 'Does the ink color match what the word says? YES or NO', color: '#ff9900' },
  { id: 'count',    label: 'Count the LETTERS',     desc: 'How many letters does the color word have?',            color: '#ff4466' },
];

// Extra rules used only in sub-rounds 3 & 4 (Tryhard)
const EXTRA_RULES_POOL = [3, 4]; // indices into RULES for hard sub-rounds

const TIME_LIMITS_BY_ROUND = [5000, 4500, 4000, 3500, 3000];

function getTotalSubRounds(personality) {
  const id = personality?.id || 'normal';
  if (id === 'sleepy')  return 2;
  if (id === 'tryhard') return 5;
  return 3;
}

function getRuleForSubRound(roundIndex, totalRounds) {
  if (totalRounds <= 3) return RULES[roundIndex % 3];
  // For 5 rounds: 0→color, 1→word, 2→opposite, 3→both, 4→count
  return RULES[roundIndex] || RULES[roundIndex % 3];
}

// Special handlers for extra rule types
function resolveExtraRule(ruleId, wordColor, inkColor, picked) {
  if (ruleId === 'both') {
    // question is "does ink match word?" — we present YES/NO
    // correct = whether they match
    return null; // handled separately
  }
  if (ruleId === 'count') {
    return null; // handled separately
  }
  return null;
}

export default function RuleRoulette({ onRoundEnd, onRoundComplete, aiPersonality }) {
  const totalSubRounds = getTotalSubRounds(aiPersonality);

  const [subRound,     setSubRound]     = useState(0);
  const [phase,        setPhase]        = useState('showRule');
  const [wordColor,    setWordColor]    = useState(null);
  const [inkColor,     setInkColor]     = useState(null);
  const [correctAnswer,setCorrectAnswer]= useState(null); // color obj OR string for special rules
  const [options,      setOptions]      = useState([]);
  const [timeLeft,     setTimeLeft]     = useState(5000);
  const [feedback,     setFeedback]     = useState('');
  const [result,       setResult]       = useState(null);
  const [subResults,   setSubResults]   = useState([]);
  const [currentRule,  setCurrentRule]  = useState(RULES[0]);
  const [specialMode,  setSpecialMode]  = useState(null); // 'yesno' | 'count' | null

  const answeredRef    = useRef(false);
  const timerRef       = useRef(null);
  const aiTimerRef     = useRef(null);
  const subResultsRef  = useRef([]);
  const initializedRef = useRef(false);
  const currentRuleRef = useRef(RULES[0]);
  const correctRef     = useRef(null);
  const specialModeRef = useRef(null);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    setupSubRound(0);
    return () => { clearInterval(timerRef.current); clearTimeout(aiTimerRef.current); };
  }, []);

  const setupSubRound = (roundIndex) => {
    clearInterval(timerRef.current);
    clearTimeout(aiTimerRef.current);
    answeredRef.current = false;

    const rule = getRuleForSubRound(roundIndex, totalSubRounds);
    currentRuleRef.current = rule;
    setCurrentRule(rule);

    const wColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    let iColor;
    do { iColor = COLORS[Math.floor(Math.random() * COLORS.length)]; }
    while (iColor.name === wColor.name);

    let correct;
    let specMode = null;
    let opts = [];

    if (rule.id === 'color') {
      correct = iColor;
      const wrong = COLORS.filter(c => c.name !== correct.name).sort(() => Math.random() - 0.5).slice(0, 3);
      opts = [...wrong, correct].sort(() => Math.random() - 0.5);

    } else if (rule.id === 'word') {
      correct = wColor;
      const wrong = COLORS.filter(c => c.name !== correct.name).sort(() => Math.random() - 0.5).slice(0, 3);
      opts = [...wrong, correct].sort(() => Math.random() - 0.5);

    } else if (rule.id === 'opposite') {
      const others = COLORS.filter(c => c.name !== iColor.name && c.name !== wColor.name);
      correct = others[Math.floor(Math.random() * others.length)];
      const wrong = COLORS.filter(c => c.name !== correct.name).sort(() => Math.random() - 0.5).slice(0, 3);
      opts = [...wrong, correct].sort(() => Math.random() - 0.5);

    } else if (rule.id === 'both') {
      // Does ink color match the word? YES or NO
      const matches = inkColor.name === wColor.name; // always false since we enforce different above
      // For variety, sometimes make them match
      let finalInk = iColor;
      const forceMatch = Math.random() < 0.4;
      if (forceMatch) finalInk = wColor;
      correct = finalInk.name === wColor.name ? { name: 'YES', hex: '#00ff88', light: 'rgba(0,255,136,0.1)' } : { name: 'NO', hex: '#ff4444', light: 'rgba(255,68,68,0.1)' };
      opts = [
        { name: 'YES', hex: '#00ff88', light: 'rgba(0,255,136,0.1)' },
        { name: 'NO',  hex: '#ff4444', light: 'rgba(255,68,68,0.1)' },
      ];
      specMode = 'yesno';
      // Override inkColor for this round
      setInkColor(finalInk);

    } else if (rule.id === 'count') {
      // How many letters in the word color name?
      const correctCount = wColor.name.length;
      correct = { name: String(correctCount), hex: '#ff4466', light: 'rgba(255,68,102,0.1)' };
      const allCounts = [3, 4, 5, 6].map(n => ({ name: String(n), hex: '#ff4466', light: 'rgba(255,68,102,0.1)' }));
      opts = allCounts.sort(() => Math.random() - 0.5);
      specMode = 'count';
    }

    correctRef.current = correct;
    specialModeRef.current = specMode;

    setSubRound(roundIndex);
    setWordColor(wColor);
    if (rule.id !== 'both') setInkColor(iColor);
    setCorrectAnswer(correct);
    setOptions(opts);
    setTimeLeft(TIME_LIMITS_BY_ROUND[roundIndex] || 3000);
    setFeedback('');
    setResult(null);
    setPhase('showRule');
    setSpecialMode(specMode);

    setTimeout(() => {
      if (!answeredRef.current) {
        setPhase('play');
        startTimer(roundIndex, correct);
      }
    }, 2250);
  };

  const startTimer = (roundIndex, correct) => {
    const timeLimit = TIME_LIMITS_BY_ROUND[roundIndex] || 3000;
    const aiDelay   = aiLogic.getAIRulesTime(roundIndex, aiPersonality);
    let remaining   = timeLimit;

    timerRef.current = setInterval(() => {
      remaining -= 100;
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        clearTimeout(aiTimerRef.current);
        if (!answeredRef.current) resolveSubRound(false, roundIndex, 'Time up! AI wins this one.');
      }
    }, 100);

    aiTimerRef.current = setTimeout(() => {
      if (!answeredRef.current) resolveSubRound(false, roundIndex, 'AI answered first!');
    }, aiDelay);
  };

  const handlePick = (option) => {
    if (answeredRef.current || phase !== 'play') return;
    clearInterval(timerRef.current);
    clearTimeout(aiTimerRef.current);
    soundEffects.playClickSound();

    const correct = correctRef.current;
    const isCorrect = option.name === correct.name;
    if (isCorrect) {
      soundEffects.playCorrectSound();
      resolveSubRound(true, subRound, '✓ Correct! You beat the AI!');
    } else {
      soundEffects.playWrongSound();
      resolveSubRound(false, subRound, `✗ Wrong! Answer was "${correct.name}"`);
    }
  };

  const resolveSubRound = (humanWon, roundIndex, msg) => {
    if (answeredRef.current) return;
    answeredRef.current = true;
    clearInterval(timerRef.current);
    clearTimeout(aiTimerRef.current);

    setFeedback(msg);
    setResult(humanWon ? 'win' : 'lose');
    setPhase('result');

    const newResults = [...subResultsRef.current, humanWon ? 'human' : 'ai'];
    subResultsRef.current = newResults;
    setSubResults([...newResults]);

    setTimeout(() => {
      if (roundIndex < totalSubRounds - 1) {
        setupSubRound(roundIndex + 1);
      } else {
        const humanWins   = newResults.filter(r => r === 'human').length;
        const majority    = Math.ceil(totalSubRounds / 2);
        const finalWinner = humanWins >= majority ? 'human' : 'ai';
        if (finalWinner === 'human') soundEffects.playRoundWinSound();
        else soundEffects.playRoundLoseSound();
        setTimeout(() => {
          const cb = onRoundEnd || onRoundComplete;
          if (cb) cb(finalWinner, null, null);
        }, 800);
      }
    }, 2000);
  };

  const timerPercent = (timeLeft / (TIME_LIMITS_BY_ROUND[subRound] || 3000)) * 100;
  const timerColor   = timerPercent > 50 ? '#00ff88' : timerPercent > 25 ? '#ffaa00' : '#ff4444';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: 'auto', gap: '0.8rem',
      padding: '0.5rem 1rem', textAlign: 'center',
    }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#bf00ff' }}>
        Round 03 — Hard {totalSubRounds === 5 ? '· 5 Sub-Rounds' : totalSubRounds === 2 ? '· 2 Sub-Rounds' : ''}
      </div>

      <h2 style={{ fontSize: 'clamp(1.2rem,3vw,1.8rem)', fontWeight: 900, color: '#bf00ff', margin: 0 }}>
        Rule Roulette
      </h2>

      {/* Sub-round dots */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {Array.from({ length: totalSubRounds }).map((_, i) => (
          <div key={i} style={{
            width: 12, height: 12, borderRadius: '50%',
            background: subResultsRef.current[i] === 'human' ? '#00ff88'
              : subResultsRef.current[i] === 'ai' ? '#ff4444'
              : i === subRound ? '#ffaa00' : 'rgba(255,255,255,0.1)',
            border: `2px solid ${i === subRound && phase !== 'result' ? '#ffaa00' : 'transparent'}`,
            transition: 'all 0.3s',
            boxShadow: i === subRound && phase !== 'result' ? '0 0 8px #ffaa00' : 'none',
          }} />
        ))}
      </div>

      {phase === 'showRule' && (
        <div style={{
          padding: '0.8rem 1.5rem',
          border: `2px solid ${currentRule.color}`,
          borderRadius: 16,
          background: `${currentRule.color}10`,
          maxWidth: 420, width: '100%',
          animation: 'fadeIn 0.3s ease',
        }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: currentRule.color, marginBottom: 8 }}>
            {currentRule.label}
          </div>
          <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>
            {currentRule.desc}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', marginTop: 8, letterSpacing: '0.1em' }}>
            Sub-round {subRound + 1} of {totalSubRounds}
          </div>
        </div>
      )}

      {phase === 'play' && wordColor && inkColor && (
        <>
          <div style={{
            fontSize: '0.82rem', fontWeight: 700,
            color: currentRule.color,
            padding: '5px 18px',
            border: `1px solid ${currentRule.color}50`,
            borderRadius: 20,
            background: `${currentRule.color}10`,
          }}>
            {currentRule.label}
          </div>

          {/* The stroop word — hide for count/yesno modes that need the word */}
          {specialMode !== 'yesno' && (
            <div style={{
              fontSize: specialMode === 'count' ? 'clamp(1.5rem,5vw,2.5rem)' : 'clamp(1.8rem,6vw,3rem)',
              fontWeight: 900,
              color: specialMode === 'count' ? '#ffffff' : inkColor.hex,
              textShadow: specialMode === 'count' ? 'none' : `0 0 20px ${inkColor.hex}, 0 0 40px ${inkColor.hex}80`,
              letterSpacing: '4px',
              padding: '1rem 2rem', borderRadius: 12,
              background: 'rgba(255,255,255,0.03)',
              border: '0.5px solid rgba(255,255,255,0.08)',
            }}>
              {wordColor.name.toUpperCase()}
            </div>
          )}

          {specialMode === 'yesno' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 'clamp(1.8rem,6vw,3rem)', fontWeight: 900, color: inkColor.hex, textShadow: `0 0 20px ${inkColor.hex}`, letterSpacing: '4px', padding: '1rem 2rem', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)' }}>
                {wordColor.name.toUpperCase()}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
                Ink: <span style={{ color: inkColor.hex, fontWeight: 700 }}>{inkColor.name}</span> · Word: <span style={{ color: '#fff', fontWeight: 700 }}>{wordColor.name}</span>
              </div>
            </div>
          )}

          {/* Timer */}
          <div style={{ width: '100%', maxWidth: 400, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${timerPercent}%`, background: timerColor, borderRadius: 4, transition: 'width 0.1s linear, background 0.3s' }} />
          </div>

          {/* Options */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: options.length === 2 ? '1fr 1fr' : '1fr 1fr',
            gap: 12, width: '100%', maxWidth: 360,
          }}>
            {options.map(opt => (
              <button
                key={opt.name}
                onClick={() => handlePick(opt)}
                style={{
                  padding: '10px 8px', borderRadius: 12,
                  border: `1.5px solid ${opt.hex}`,
                  background: opt.light, color: opt.hex,
                  fontSize: '1rem', fontWeight: 700,
                  cursor: 'pointer', letterSpacing: '1px',
                  textShadow: `0 0 10px ${opt.hex}80`,
                  transition: 'transform 0.1s, box-shadow 0.1s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.boxShadow = `0 0 16px ${opt.hex}60`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {opt.name}
              </button>
            ))}
          </div>

          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
            AI is thinking... ({subRound + 1}/{totalSubRounds})
          </div>
        </>
      )}

      {phase === 'result' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{
            fontSize: 'clamp(2rem,8vw,3.5rem)', fontWeight: 900,
            color: result === 'win' ? '#00ff88' : '#ff4444',
            textShadow: result === 'win' ? '0 0 20px #00ff88, 0 0 60px rgba(0,255,136,0.5)' : '0 0 20px #ff4444, 0 0 60px rgba(255,68,68,0.5)',
            letterSpacing: '0.1em',
          }}>
            {result === 'win' ? 'CORRECT!' : 'WRONG!'}
          </div>
          <div style={{ fontSize: '0.95rem', color: result === 'win' ? '#00ff88' : '#ff4444' }}>{feedback}</div>
          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)' }}>
            {subResultsRef.current.filter(r => r === 'human').length} wins · {subResultsRef.current.filter(r => r === 'ai').length} AI wins — {subRound + 1}/{totalSubRounds} done
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}