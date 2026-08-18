import { useState, useEffect, useRef, useCallback } from 'react';
import ReactionTap from '../games/ReactionTap';
import ReverseTyping from '../games/ReverseTyping';
import RuleRoulette from '../games/RuleRoulette';
import { getWinTaunt, getLoseTaunt } from '../utils/aiTaunts';

const TOTAL_ROUNDS = 3;

// ── Detailed rules for each round ──────────────────────────────────
const ROUND_RULES = [
  {
    id: 1,
    title: 'Reaction Tap',
    icon: '⚡',
    accentRaw: '#00ff88',
    difficulty: 'Easy',
    objective: 'Tap the screen the moment it turns GREEN — before the AI does.',
    rules: [
      { icon: '🟢', text: 'Wait for the screen to flash GREEN — do NOT tap early.' },
      { icon: '⚡', text: 'The moment it goes green, tap as fast as humanly possible.' },
      { icon: '🤖', text: 'AI reacts in 450–550ms. Average human is 200–300ms — you can win!' },
      { icon: '⏱️', text: 'If you don\'t tap within 3 seconds of green, AI wins automatically.' },
    ],
    tip: 'Keep your finger hovering! The difference between winning and losing is milliseconds.',
  },
  {
    id: 2,
    title: 'Reverse Typing',
    icon: '⌨️',
    accentRaw: '#00d4ff',
    difficulty: 'Moderate',
    objective: 'A word (or sentence on Hard) is shown. Type it completely BACKWARDS.',
    rules: [
      { icon: '🔤', text: 'Read the word on screen carefully.' },
      { icon: '↩️', text: 'Type every letter in reverse order — last letter first.' },
      { icon: '📏', text: 'Easy mode: 4–5 letter words. Moderate: 5–6 letters. Hard: full sentence!' },
      { icon: '✅', text: 'Round ends automatically when you type the full correct answer.' },
      { icon: '⏱️', text: 'Timer runs out → AI wins. Beat the AI\'s typing time to win.' },
    ],
    tip: 'On Hard (Tryhard AI) you get a full sentence with spaces — spaces count too!',
  },
  {
    id: 3,
    title: 'Rule Roulette',
    icon: '🎲',
    accentRaw: '#bf00ff',
    difficulty: 'Hard',
    objective: 'Answer quick-fire questions where the RULE changes every sub-round.',
    rules: [
      { icon: '👁️', text: 'A color word is shown in a DIFFERENT ink color — read carefully.' },
      { icon: '📋', text: 'Each sub-round tells you a new rule: pick the INK color, the WORD, or the OPPOSITE.' },
      { icon: '🧠', text: 'Hard mode adds 2 extra rules: does INK match WORD? (YES/NO) and count the letters.' },
      { icon: '🔢', text: 'Easy: 2 sub-rounds. Normal: 3. Tryhard AI: 5 sub-rounds — majority wins.' },
      { icon: '⏱️', text: 'Each sub-round has its own timer — it gets shorter as rounds progress!' },
    ],
    tip: 'Read the RULE label first — don\'t just react to the color you see. The rule changes every time!',
  },
];

const PHASE = { RULES: 'RULES', COUNTDOWN: 'COUNTDOWN', PLAYING: 'PLAYING', ROUND_RESULT: 'ROUND_RESULT', DONE: 'DONE' };

// ── Rules Screen ────────────────────────────────────────────────────
function RulesScreen({ roundMeta, roundNumber, aiPersonality, onReady }) {
  const [hover, setHover] = useState(false);
  const { accentRaw, icon, title, difficulty, objective, rules, tip } = roundMeta;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '75vh',
      gap: '1.2rem', padding: '1rem 0', textAlign: 'center',
      animation: 'fadeInUp 0.4s ease both',
    }}>
      {/* Badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.3rem 0.9rem', borderRadius: 100,
        border: `1px solid ${accentRaw}40`,
        background: `${accentRaw}0a`,
      }}>
        <span style={{ fontSize: 10, color: accentRaw }}>●</span>
        <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: accentRaw }}>
          Round {roundNumber} — {difficulty}
        </span>
      </div>

      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <span style={{ fontSize: '2rem' }}>{icon}</span>
        <h2 style={{ fontSize: 'clamp(1.4rem,4vw,2.2rem)', fontWeight: 900, color: '#fff', margin: 0 }}>{title}</h2>
      </div>

      {/* Objective */}
      <p style={{
        fontSize: '0.95rem', color: accentRaw, fontWeight: 600,
        maxWidth: 480, lineHeight: 1.5,
        padding: '0.6rem 1.2rem', borderRadius: 10,
        border: `1px solid ${accentRaw}30`,
        background: `${accentRaw}08`,
        margin: 0,
      }}>
        🎯 {objective}
      </p>

      {/* Rules list */}
      <div style={{ width: '100%', maxWidth: 500, display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        {rules.map((rule, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
            padding: '0.6rem 1rem', borderRadius: 10,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            textAlign: 'left',
            animation: `fadeInUp 0.35s ease ${0.05 * i}s both`,
          }}>
            <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: 1 }}>{rule.icon}</span>
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>{rule.text}</span>
          </div>
        ))}
      </div>

      {/* Pro tip */}
      <div style={{
        maxWidth: 500, width: '100%',
        padding: '0.65rem 1rem', borderRadius: 10,
        border: `1px solid rgba(255,230,0,0.2)`,
        background: 'rgba(255,230,0,0.04)',
        display: 'flex', alignItems: 'flex-start', gap: '0.6rem', textAlign: 'left',
      }}>
        <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>💡</span>
        <span style={{ fontSize: '0.8rem', color: 'rgba(255,230,0,0.75)', lineHeight: 1.5 }}>{tip}</span>
      </div>

      {/* AI personality info */}
      {aiPersonality && (
        <div style={{
          fontSize: '0.72rem', color: aiPersonality.color,
          padding: '0.3rem 0.8rem', borderRadius: 100,
          border: `1px solid ${aiPersonality.color}30`,
          background: `${aiPersonality.color}08`,
        }}>
          You're facing {aiPersonality.emoji} {aiPersonality.name} — {aiPersonality.tagline}
        </div>
      )}

      {/* Ready button */}
      <button
        onClick={onReady}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          marginTop: '0.5rem',
          padding: '0.9rem 2.8rem',
          fontSize: '0.9rem', fontWeight: 700,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          fontFamily: 'var(--font-heading)',
          color: accentRaw,
          background: hover ? `${accentRaw}18` : `${accentRaw}08`,
          border: `1px solid ${hover ? accentRaw : accentRaw + '55'}`,
          borderRadius: 12,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          transform: hover ? 'translateY(-2px)' : 'none',
          boxShadow: hover ? `0 0 24px ${accentRaw}44` : 'none',
        }}
      >
        I'm Ready — Let's Go! ▶
      </button>
    </div>
  );
}

// ── Countdown ───────────────────────────────────────────────────────
function RoundCountdown({ meta, roundNumber, onComplete }) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count === 0) { const t = setTimeout(() => onComplete(), 600); return () => clearTimeout(t); }
    const t = setTimeout(() => setCount(c => c - 1), 900);
    return () => clearTimeout(t);
  }, [count, onComplete]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '55vh', gap: '1.5rem', textAlign: 'center' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: meta.accentRaw }}>
        Round {roundNumber} — {meta.difficulty}
      </div>
      <h2 style={{ fontSize: 'clamp(1.6rem,5vw,3rem)', fontWeight: 900, color: '#fff', margin: 0 }}>{meta.title}</h2>
      <div style={{
        fontSize: 'clamp(4rem,14vw,8rem)', fontWeight: 900,
        color: count === 0 ? meta.accentRaw : '#fff',
        textShadow: count === 0 ? `0 0 40px ${meta.accentRaw}` : 'none',
        transition: 'all 0.25s', minWidth: '2ch', textAlign: 'center',
      }}>
        {count === 0 ? 'GO!' : count}
      </div>
    </div>
  );
}

// ── Round Result Splash ─────────────────────────────────────────────
function RoundResultSplash({ winner, taunt, meta, onContinue, isFinalRound }) {
  const [hover, setHover] = useState(false);
  const isHuman = winner === 'human';
  const isDraw  = winner === 'draw';
  const color   = isDraw ? '#ffe600' : isHuman ? '#00ff88' : '#ff4444';
  const text    = isDraw ? 'DRAW' : isHuman ? 'YOU WIN' : 'AI WINS';
  const sub     = isDraw ? 'Even match!' : isHuman ? 'The machine is rattled.' : 'Cold. Calculated. Ruthless.';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.5rem', padding: '2rem', textAlign: 'center' }}>
      <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: meta.accentRaw }}>
        {meta.title} — Round {meta.id} Complete
      </div>
      <div style={{ fontSize: 'clamp(2.5rem,9vw,5.5rem)', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color, textShadow: `0 0 20px ${color}, 0 0 60px ${color}50`, lineHeight: 1 }}>
        {text}
      </div>
      <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.4)' }}>{sub}</p>

      <div style={{ maxWidth: 480, width: '100%', background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 12, padding: '1.1rem 1.5rem', position: 'relative' }}>
        <div style={{ position: 'absolute', top: -10, left: 16, background: '#0a0a0a', padding: '0 0.5rem', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#00d4ff' }}>
          AI says
        </div>
        <p style={{ fontSize: '0.95rem', fontStyle: 'italic', color: '#fff', margin: 0, lineHeight: 1.5 }}>"{taunt}"</p>
      </div>

      <button
        onClick={onContinue}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase',
          color: hover ? meta.accentRaw : 'rgba(255,255,255,0.5)',
          background: hover ? `${meta.accentRaw}15` : 'transparent',
          border: `1px solid ${hover ? meta.accentRaw : 'rgba(255,255,255,0.15)'}`,
          borderRadius: 10, padding: '0.75rem 2.5rem', cursor: 'pointer', transition: 'all 0.2s',
        }}
      >
        {isFinalRound ? 'See Final Results' : 'Next Round →'}
      </button>
    </div>
  );
}

// ── Score Bar ───────────────────────────────────────────────────────
function ScoreBar({ playerName, humanScore, aiScore, roundResults, currentRound, aiPersonality }) {
  const pColor = aiPersonality?.color || '#00d4ff';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '1rem', padding: '0.85rem 1.25rem',
      background: 'rgba(10,10,20,0.88)',
      border: '1px solid rgba(0,212,255,0.1)',
      borderRadius: 14, marginBottom: '1.25rem',
    }}>
      <div style={{ textAlign: 'left', minWidth: 80 }}>
        <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>{playerName}</div>
        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#00ff88', textShadow: '0 0 12px #00ff88' }}>{humanScore}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => {
            const res = roundResults[i];
            const isActive = i === currentRound - 1;
            const bg = res === 'human' ? '#00ff88' : res === 'ai' ? '#ff4444' : res === 'draw' ? '#ffe600' : 'transparent';
            const border = isActive && !res ? '#00d4ff' : res ? bg : 'rgba(255,255,255,0.15)';
            return <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: bg, border: `2px solid ${border}`, transition: 'all 0.3s' }} />;
          })}
        </div>
        <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
          Round {currentRound} / {TOTAL_ROUNDS}
        </div>
        {aiPersonality && (
          <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: pColor, opacity: 0.8 }}>
            vs {aiPersonality.emoji} {aiPersonality.name}
          </div>
        )}
      </div>
      <div style={{ textAlign: 'right', minWidth: 80 }}>
        <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>AI</div>
        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: pColor, textShadow: `0 0 12px ${pColor}` }}>{aiScore}</div>
      </div>
    </div>
  );
}

// ── Main GameScreen ─────────────────────────────────────────────────
const GAME_COMPONENTS = [ReactionTap, ReverseTyping, RuleRoulette];

export default function GameScreen({ playerName, aiPersonality, onGameEnd }) {
  const [currentRound, setCurrentRound] = useState(1);
  const [phase,        setPhase]        = useState(PHASE.RULES);
  const [humanScore,   setHumanScore]   = useState(0);
  const [aiScore,      setAiScore]      = useState(0);
  const [roundResults, setRoundResults] = useState([]);
  const [lastWinner,   setLastWinner]   = useState(null);
  const [lastTaunt,    setLastTaunt]    = useState('');

  const humanScoreRef   = useRef(0);
  const aiScoreRef      = useRef(0);
  const roundResultsRef = useRef([]);

  const meta          = ROUND_RULES[currentRound - 1];
  const GameComponent = GAME_COMPONENTS[currentRound - 1];

  const handleRoundComplete = useCallback((winner) => {
    const w = typeof winner === 'string' ? winner : 'draw';
    humanScoreRef.current  += w === 'human' ? 1 : 0;
    aiScoreRef.current     += w === 'ai'    ? 1 : 0;
    roundResultsRef.current = [...roundResultsRef.current, w];
    setHumanScore(humanScoreRef.current);
    setAiScore(aiScoreRef.current);
    setRoundResults([...roundResultsRef.current]);
    setLastWinner(w);
    setLastTaunt(w === 'human' ? getLoseTaunt() : getWinTaunt());
    setPhase(PHASE.ROUND_RESULT);
  }, []);

  const handleContinue = useCallback(() => {
    if (currentRound >= TOTAL_ROUNDS) {
      setPhase(PHASE.DONE);
      setTimeout(() => onGameEnd(humanScoreRef.current, aiScoreRef.current, roundResultsRef.current), 600);
      return;
    }
    setCurrentRound(r => r + 1);
    setPhase(PHASE.RULES); // ← go to rules screen for next round
  }, [currentRound, onGameEnd]);

  useEffect(() => {
    if (phase !== PHASE.ROUND_RESULT) return;
    const handler = (e) => { if (e.key === 'Enter') handleContinue(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, handleContinue]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '1.25rem 1.5rem 3rem', maxWidth: 860, margin: '0 auto', width: '100%' }}>

      <ScoreBar
        playerName={playerName}
        humanScore={humanScore}
        aiScore={aiScore}
        roundResults={roundResults}
        currentRound={currentRound}
        aiPersonality={aiPersonality}
      />

      {/* Rules screen — shown before each round */}
      {phase === PHASE.RULES && (
        <RulesScreen
          key={`rules-${currentRound}`}
          roundMeta={meta}
          roundNumber={currentRound}
          aiPersonality={aiPersonality}
          onReady={() => setPhase(PHASE.COUNTDOWN)}
        />
      )}

      {/* Countdown 3-2-1-GO */}
      {phase === PHASE.COUNTDOWN && (
        <RoundCountdown
          key={`cd-${currentRound}`}
          meta={meta}
          roundNumber={currentRound}
          onComplete={() => setPhase(PHASE.PLAYING)}
        />
      )}

      {/* Actual game */}
      {phase === PHASE.PLAYING && (
        <GameComponent
          key={`game-${currentRound}`}
          playerName={playerName}
          aiPersonality={aiPersonality}
          onRoundEnd={handleRoundComplete}
          onRoundComplete={handleRoundComplete}
        />
      )}

      {/* Round result */}
      {phase === PHASE.ROUND_RESULT && (
        <RoundResultSplash
          key={`result-${currentRound}`}
          winner={lastWinner}
          taunt={lastTaunt}
          meta={meta}
          onContinue={handleContinue}
          isFinalRound={currentRound >= TOTAL_ROUNDS}
        />
      )}

      {/* Done transitioning */}
      {phase === PHASE.DONE && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '55vh', gap: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Battle Complete</div>
          <div style={{ fontSize: 'clamp(2rem,6vw,3.5rem)', fontWeight: 900, background: 'linear-gradient(135deg, #00ff88, #00d4ff, #bf00ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Tallying Results...
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}