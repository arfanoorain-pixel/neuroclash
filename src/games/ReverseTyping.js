import React, { useState, useEffect, useRef } from 'react';
import aiLogic from '../utils/aiLogic';
import soundEffects from '../utils/soundEffects';

// Easy (Sleepy AI): 4-5 letters
const EASY_WORDS = [
  'FIRE','STAR','MIND','BOLT','ZERO','FLUX','CORE','WAVE','VOID','ZONE',
  'APEX','DARK','NEON','BYTE','ATOM','GRID','LINK','NODE','BEAM','ECHO',
];

// Moderate (Normal AI): 5-6 letters
const MODERATE_WORDS = [
  'PYTHON','GALAXY','BRIDGE','ROCKET','JUNGLE','CASTLE','MIRROR','FROZEN',
  'PLANET','RHYTHM','SYSTEM','FLAMES','MATRIX','NEXUS','CIPHER','VECTOR',
  'PORTAL','STORM','TURBO','LASER','PRISM','ORBIT','PIXEL','FORGE',
];

// Hard (Tryhard AI): full sentences
const HARD_SENTENCES = [
  'HACK THE SYSTEM',
  'SPEED IS POWER',
  'MIND OVER CODE',
  'BREAK THE LOOP',
  'ZERO IS HERO',
  'DATA NEVER LIES',
  'THINK THEN TYPE',
  'FAST OR LAST',
];

function getConfig(personality) {
  const id = personality?.id || 'normal';
  if (id === 'sleepy')  return { pool: EASY_WORDS,      timeLimit: 8000,  label: 'Easy',                  isSentence: false };
  if (id === 'tryhard') return { pool: HARD_SENTENCES,  timeLimit: 18000, label: 'Hard — Sentence Mode',  isSentence: true  };
  return                       { pool: MODERATE_WORDS,  timeLimit: 6000,  label: 'Moderate',               isSentence: false };
}

export default function ReverseTyping({ onRoundEnd, onRoundComplete, aiPersonality }) {
  const [word, setWord]           = useState('');
  const [reversed, setReversed]   = useState('');
  const [input, setInput]         = useState('');
  const [phase, setPhase]         = useState('play');
  const [timeLeft, setTimeLeft]   = useState(5000);
  const [aiStatus, setAiStatus]   = useState('typing...');
  const [result, setResult]       = useState(null);
  const [humanTime, setHumanTime] = useState(null);
  const [aiTime, setAiTime]       = useState(null);
  const [cfg, setCfg]             = useState({ label: 'Moderate', isSentence: false });

  const startTimeRef  = useRef(null);
  const aiTimerRef    = useRef(null);
  const timerRef      = useRef(null);
  const answeredRef   = useRef(false);
  const aiTimeRef     = useRef(null);
  const timeLimitRef  = useRef(5000);

  useEffect(() => {
    const config = getConfig(aiPersonality);
    const randomWord = config.pool[Math.floor(Math.random() * config.pool.length)];
    const rev = randomWord.split('').reverse().join('');
    setCfg(config);
    setWord(randomWord);
    setReversed(rev);
    timeLimitRef.current = config.timeLimit;
    setTimeLeft(config.timeLimit);
    startGame(randomWord, config.timeLimit);
    return () => { clearTimeout(aiTimerRef.current); clearInterval(timerRef.current); };
  }, []);

  const startGame = (w, timeLimit) => {
    answeredRef.current = false;
    startTimeRef.current = Date.now();
    let ai = aiLogic.simulateAITyping(w, aiPersonality);
    if (aiPersonality?.id === 'tryhard') {
  const sentenceLength = w.length;
  // AI takes 300ms per character + 8s base penalty on hard mode
  ai = sentenceLength * 200 + 6000;
}
    aiTimeRef.current = ai;
    setAiTime(ai);

    let remaining = timeLimit;
    timerRef.current = setInterval(() => {
      remaining -= 100;
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        clearTimeout(aiTimerRef.current);
        if (!answeredRef.current) resolveRound(null, aiTimeRef.current);
      }
    }, 100);

    aiTimerRef.current = setTimeout(() => {
      if (!answeredRef.current) { setAiStatus('done!'); resolveRound(null, ai); }
    }, ai);
  };

  const handleKeyDown = () => soundEffects.playClickSound();

  const handleInput = (e) => {
    const val = e.target.value.toUpperCase();
    setInput(val);
    if (val === reversed) {
      clearInterval(timerRef.current);
      clearTimeout(aiTimerRef.current);
      const hTime = Date.now() - startTimeRef.current;
      setHumanTime(hTime);
      resolveRound(hTime, aiTimeRef.current);
    }
  };

  const resolveRound = (hTime, aTime) => {
    if (answeredRef.current) return;
    answeredRef.current = true;
    clearInterval(timerRef.current);
    clearTimeout(aiTimerRef.current);
    const winner = hTime !== null && hTime < aTime ? 'human' : 'ai';
    setResult(winner);
    setPhase('result');
    if (winner === 'human') soundEffects.playRoundWinSound();
    else soundEffects.playRoundLoseSound();
    setTimeout(() => {
      const cb = onRoundEnd || onRoundComplete;
      if (cb) cb(winner, hTime, aTime);
    }, 2000);
  };

  const timerPercent = (timeLeft / timeLimitRef.current) * 100;
  const timerColor   = timerPercent > 50 ? '#00ff88' : timerPercent > 25 ? '#ffaa00' : '#ff4444';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.5rem 1rem', minHeight: '100vh', justifyContent: 'center', gap: '1.5rem' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#00d4ff' }}>
        Round 02 — {cfg.label}
      </div>
      <h2 style={{ fontSize: 'clamp(1.5rem,5vw,2.5rem)', fontWeight: 900, color: '#00d4ff', margin: 0 }}>Reverse Typing</h2>

      {phase === 'play' && (
        <>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            {cfg.isSentence ? 'Type this SENTENCE — completely backwards!' : 'Type this word — BACKWARDS!'}
          </p>

          <div style={{
            fontSize: cfg.isSentence ? 'clamp(1.2rem,4vw,2rem)' : 'clamp(2rem,8vw,4rem)',
            fontWeight: 900, color: '#ffffff',
            letterSpacing: cfg.isSentence ? '3px' : '8px',
            background: 'rgba(0,255,136,0.05)',
            padding: '16px 32px', borderRadius: 12,
            border: '0.5px solid rgba(0,255,136,0.3)',
            textAlign: 'center', maxWidth: 520,
          }}>
            {word}
          </div>

          {cfg.isSentence && (
            <div style={{
              fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)',
              padding: '5px 14px', borderRadius: 20,
              border: '1px solid rgba(191,0,255,0.25)',
              background: 'rgba(191,0,255,0.06)',
            }}>
              ⚠️ Include spaces! Every character reversed.
            </div>
          )}

          <div style={{ width: '100%', maxWidth: 440, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${timerPercent}%`, background: timerColor, borderRadius: 4, transition: 'width 0.1s linear' }} />
          </div>

          <input
            style={{
              width: '100%', maxWidth: 520, padding: '14px 20px',
              fontSize: cfg.isSentence ? '1.05rem' : '1.5rem',
              fontWeight: 700, textAlign: 'center',
              background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.4)',
              borderRadius: 12, color: '#00d4ff',
              letterSpacing: cfg.isSentence ? '2px' : '4px',
              outline: 'none',
            }}
            value={input}
            onKeyDown={handleKeyDown}
            onChange={handleInput}
            placeholder={cfg.isSentence ? 'Type sentence reversed...' : 'Type reversed...'}
            maxLength={word.length}
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />

          {/* Character hint dots */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2, fontSize: '1.1rem', letterSpacing: cfg.isSentence ? '2px' : '5px' }}>
            {reversed.split('').map((ch, i) => (
              <span key={i} style={{
                color: input[i] === reversed[i] ? '#00ff88' : 'rgba(255,255,255,0.2)',
                marginRight: ch === ' ' ? 6 : 0,
              }}>
                {ch === ' ' ? '·' : '_'}
              </span>
            ))}
          </div>

          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>AI is {aiStatus}</div>
        </>
      )}

      {phase === 'result' && (
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <div style={{
            fontSize: 'clamp(2rem,8vw,4rem)', fontWeight: 900,
            color: result === 'human' ? '#00ff88' : '#ff4444',
            textShadow: result === 'human' ? '0 0 20px #00ff88' : '0 0 20px #ff4444',
            letterSpacing: '0.1em',
          }}>
            {result === 'human' ? 'YOU WIN!' : 'AI WINS!'}
          </div>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)' }}>
            {cfg.isSentence ? 'Sentence' : 'Word'}: <span style={{ color: '#00d4ff', fontWeight: 700 }}>{word}</span>
          </p>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)' }}>
            Reversed: <span style={{ color: '#bf00ff', fontWeight: 700 }}>{reversed}</span>
          </p>
          {humanTime && <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)' }}>Your time: <span style={{ color: '#00ff88', fontWeight: 700 }}>{humanTime}ms</span></p>}
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)' }}>AI time: <span style={{ color: '#ff4444', fontWeight: 700 }}>{aiTime}ms</span></p>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.25)', marginTop: 8 }}>Next round loading...</div>
        </div>
      )}
    </div>
  );
}