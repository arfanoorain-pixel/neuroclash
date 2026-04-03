import { useState, useEffect, useRef, useCallback } from 'react';
import ReactionTap   from '../games/ReactionTap';
import ReverseTyping from '../games/ReverseTyping';
import RuleRoulette  from '../games/RuleRoulette';
import { getRandomTaunt } from '../utils/aiTaunts';

// ── Constants ────────────────────────────────────────────────
const TOTAL_ROUNDS = 3;

const ROUND_META = [
  {
    id: 1,
    title: 'Reaction Tap',
    subtitle: 'Pure reflex. No thinking. Just tap.',
    difficulty: 'Easy',
    diffColor: 'var(--neon-green)',
    diffGlow:  'var(--glow-green)',
    accent:    'var(--neon-green)',
    accentRaw: '#00ff88',
    component: ReactionTap,
  },
  {
    id: 2,
    title: 'Reverse Typing',
    subtitle: 'Spell it backwards. Fast.',
    difficulty: 'Moderate',
    diffColor: 'var(--neon-blue)',
    diffGlow:  'var(--glow-blue)',
    accent:    'var(--neon-blue)',
    accentRaw: '#00d4ff',
    component: ReverseTyping,
  },
  {
    id: 3,
    title: 'Rule Roulette',
    subtitle: 'Rules shift. Adapt or lose.',
    difficulty: 'Hard',
    diffColor: 'var(--neon-purple)',
    diffGlow:  'var(--glow-purple)',
    accent:    'var(--neon-purple)',
    accentRaw: '#bf00ff',
    component: RuleRoulette,
  },
];

// ── Phase constants ──────────────────────────────────────────
const PHASE = {
  INTRO:       'INTRO',       // pre-round countdown
  PLAYING:     'PLAYING',     // game component active
  ROUND_RESULT:'ROUND_RESULT',// brief result splash
  DONE:        'DONE',        // all rounds finished
};

// ── ScoreBar ────────────────────────────────────────────────
function ScoreBar({ playerName, humanScore, aiScore, roundResults, currentRound }) {
  const [prevHuman, setPrevHuman] = useState(humanScore);
  const [prevAI,    setPrevAI]    = useState(aiScore);
  const [flashH,    setFlashH]    = useState(false);
  const [flashA,    setFlashA]    = useState(false);

  useEffect(() => {
    if (humanScore !== prevHuman) {
      setFlashH(true);
      setTimeout(() => setFlashH(false), 500);
      setPrevHuman(humanScore);
    }
  }, [humanScore]);

  useEffect(() => {
    if (aiScore !== prevAI) {
      setFlashA(true);
      setTimeout(() => setFlashA(false), 500);
      setPrevAI(aiScore);
    }
  }, [aiScore]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      padding: '1rem 1.5rem',
      background: 'rgba(10,10,20,0.85)',
      border: '1px solid rgba(0,212,255,0.12)',
      borderRadius: 14,
      backdropFilter: 'blur(8px)',
      position: 'sticky',
      top: '1rem',
      zIndex: 20,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      {/* Human */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 80 }}>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '0.58rem',
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: 2,
        }}>
          {playerName}
        </span>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
          fontWeight: 900,
          lineHeight: 1,
          color: 'var(--neon-green)',
          textShadow: 'var(--glow-green)',
          transition: 'transform 0.15s',
          transform: flashH ? 'scale(1.25)' : 'scale(1)',
          display: 'inline-block',
          animation: flashH ? 'scorePop 0.4s cubic-bezier(0.175,0.885,0.32,1.275)' : 'none',
        }}>
          {humanScore}
        </span>
      </div>

      {/* Round dots */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => {
            const res = roundResults[i];
            let dotColor   = 'transparent';
            let dotBorder  = 'rgba(255,255,255,0.1)';
            let dotGlow    = 'none';
            let isActive   = i === currentRound - 1;

            if (res === 'human') { dotColor = 'var(--neon-green)';  dotBorder = 'var(--neon-green)';  dotGlow = '0 0 8px #00ff88, 0 0 16px rgba(0,255,136,0.5)'; }
            if (res === 'ai')    { dotColor = 'var(--neon-red)';    dotBorder = 'var(--neon-red)';    dotGlow = '0 0 8px #ff003c, 0 0 16px rgba(255,0,60,0.5)'; }
            if (res === 'draw')  { dotColor = 'var(--neon-yellow)'; dotBorder = 'var(--neon-yellow)'; dotGlow = '0 0 8px #ffe600'; }

            return (
              <div key={i} style={{
                width: 12, height: 12,
                borderRadius: '50%',
                background: dotColor,
                border: `2px solid ${isActive && !res ? 'var(--neon-blue)' : dotBorder}`,
                boxShadow: isActive && !res
                  ? '0 0 8px rgba(0,212,255,0.7), 0 0 16px rgba(0,212,255,0.3)'
                  : dotGlow,
                transition: 'all 0.3s ease',
                animation: isActive && !res ? 'roundPing 1.5s ease-in-out infinite' : 'none',
              }} />
            );
          })}
        </div>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '0.55rem',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}>
          Round {currentRound} / {TOTAL_ROUNDS}
        </span>
      </div>

      {/* AI */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 80 }}>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '0.58rem',
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: 2,
        }}>
          AI
        </span>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
          fontWeight: 900,
          lineHeight: 1,
          color: 'var(--neon-blue)',
          textShadow: 'var(--glow-blue)',
          transition: 'transform 0.15s',
          transform: flashA ? 'scale(1.25)' : 'scale(1)',
          display: 'inline-block',
          animation: flashA ? 'scorePop 0.4s cubic-bezier(0.175,0.885,0.32,1.275)' : 'none',
        }}>
          {aiScore}
        </span>
      </div>
    </div>
  );
}

// ── RoundIntro ───────────────────────────────────────────────
function RoundIntro({ meta, roundNumber, onComplete }) {
  const [count, setCount] = useState(3);
  const [phase, setPhase] = useState('in'); // 'in' | 'counting' | 'go'

  useEffect(() => {
    const t0 = setTimeout(() => setPhase('counting'), 400);
    return () => clearTimeout(t0);
  }, []);

  useEffect(() => {
    if (phase !== 'counting') return;
    if (count === 0) {
      const t = setTimeout(() => { setPhase('go'); }, 400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCount(c => c - 1), 800);
    return () => clearTimeout(t);
  }, [count, phase]);

  useEffect(() => {
    if (phase !== 'go') return;
    const t = setTimeout(onComplete, 700);
    return () => clearTimeout(t);
  }, [phase, onComplete]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '55vh',
      gap: '1.5rem',
      animation: 'fadeIn 0.35s ease',
    }}>
      {/* Round label */}
      <div style={{
        fontFamily: 'var(--font-heading)',
        fontSize: '0.7rem',
        fontWeight: 700,
        letterSpacing: '0.3em',
        textTransform: 'uppercase',
        color: meta.diffColor,
        textShadow: meta.diffGlow,
        animation: 'slideInUp 0.4s ease both',
      }}>
        Round {roundNumber} — {meta.difficulty}
      </div>

      {/* Game title */}
      <h2 style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 'clamp(1.6rem, 5vw, 3rem)',
        fontWeight: 900,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--text-bright)',
        textShadow: `0 0 30px ${meta.accentRaw}60`,
        margin: 0,
        animation: 'slideInUp 0.4s ease 0.1s both',
      }}>
        {meta.title}
      </h2>

      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: '1rem',
        color: 'var(--text-secondary)',
        animation: 'slideInUp 0.4s ease 0.2s both',
      }}>
        {meta.subtitle}
      </p>

      {/* Divider */}
      <div style={{
        width: 120, height: 1,
        background: `linear-gradient(90deg, transparent, ${meta.accentRaw}, transparent)`,
        animation: 'slideInUp 0.4s ease 0.25s both',
      }} />

      {/* Countdown */}
      <div style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 'clamp(4rem, 14vw, 8rem)',
        fontWeight: 900,
        lineHeight: 1,
        color: phase === 'go' ? meta.accentRaw : 'var(--text-bright)',
        textShadow: phase === 'go'
          ? `0 0 20px ${meta.accentRaw}, 0 0 60px ${meta.accentRaw}80`
          : '0 0 20px rgba(255,255,255,0.3)',
        transition: 'all 0.25s ease',
        animation: 'scalePop 0.3s cubic-bezier(0.175,0.885,0.32,1.275)',
        key: count,
        letterSpacing: '-0.02em',
        minWidth: '2ch',
        textAlign: 'center',
      }}>
        {phase === 'go' ? 'GO!' : count || ''}
      </div>

      {/* Ring around countdown */}
      <div style={{
        position: 'absolute',
        width: 'clamp(120px, 25vw, 180px)',
        height: 'clamp(120px, 25vw, 180px)',
        borderRadius: '50%',
        border: `2px solid ${meta.accentRaw}30`,
        boxShadow: `0 0 30px ${meta.accentRaw}20, inset 0 0 30px ${meta.accentRaw}10`,
        animation: 'rotateSlow 6s linear infinite',
        pointerEvents: 'none',
      }} />
    </div>
  );
}

// ── RoundResultSplash ────────────────────────────────────────
function RoundResultSplash({ winner, playerName, taunt, meta, onContinue, isFinalRound }) {
  const [visible, setVisible] = useState(false);
  const [btnHover, setBtnHover] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const isHuman = winner === 'human';
  const isDraw  = winner === 'draw';

  const resultColor = isDraw
    ? 'var(--neon-yellow)'
    : isHuman ? 'var(--neon-green)' : 'var(--neon-red)';

  const resultGlow = isDraw
    ? '0 0 12px #ffe600, 0 0 40px rgba(255,230,0,0.5)'
    : isHuman
      ? 'var(--glow-green)'
      : '0 0 12px #ff003c, 0 0 40px rgba(255,0,60,0.5)';

  const resultText = isDraw
    ? 'DRAW'
    : isHuman ? 'YOU WIN' : 'AI WINS';

  const subText = isDraw
    ? "Honors even. Rematch incoming."
    : isHuman
      ? "Impressive. The machine is rattled."
      : "Calculated. Cold. Ruthless.";

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: '1.5rem',
      padding: '2rem',
      textAlign: 'center',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.3s ease',
    }}>
      {/* Round label */}
      <div style={{
        fontFamily: 'var(--font-heading)',
        fontSize: '0.65rem',
        fontWeight: 700,
        letterSpacing: '0.25em',
        textTransform: 'uppercase',
        color: meta.diffColor,
        textShadow: meta.diffGlow,
        animation: 'slideInUp 0.4s ease both',
      }}>
        {meta.title} — Round {meta.id} Complete
      </div>

      {/* Winner banner */}
      <div style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 'clamp(2.5rem, 9vw, 5.5rem)',
        fontWeight: 900,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: resultColor,
        textShadow: `${resultGlow}, 0 0 100px ${resultColor}30`,
        lineHeight: 1,
        animation: 'resultReveal 0.6s cubic-bezier(0.175,0.885,0.32,1.275) 0.1s both',
      }}>
        {resultText}
      </div>

      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: '1rem',
        color: 'var(--text-secondary)',
        animation: 'slideInUp 0.4s ease 0.3s both',
      }}>
        {subText}
      </p>

      {/* AI Taunt box */}
      <div style={{
        maxWidth: 480,
        width: '100%',
        background: 'rgba(0,212,255,0.04)',
        border: '1px solid rgba(0,212,255,0.15)',
        borderRadius: 12,
        padding: '1.1rem 1.5rem',
        position: 'relative',
        animation: 'slideInUp 0.5s ease 0.45s both',
      }}>
        <div style={{
          position: 'absolute',
          top: -10, left: 16,
          background: 'var(--bg-primary)',
          padding: '0 0.5rem',
          fontFamily: 'var(--font-heading)',
          fontSize: '0.55rem',
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--neon-blue)',
          textShadow: 'var(--glow-blue)',
        }}>
          AI says
        </div>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.95rem',
          fontWeight: 500,
          fontStyle: 'italic',
          color: 'var(--text-primary)',
          margin: 0,
          lineHeight: 1.5,
        }}>
          "{taunt}"
        </p>
      </div>

      {/* Continue button */}
      <button
        onClick={onContinue}
        onMouseEnter={() => setBtnHover(true)}
        onMouseLeave={() => setBtnHover(false)}
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '0.85rem',
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: btnHover ? meta.accentRaw : 'var(--text-secondary)',
          background: btnHover
            ? `rgba(${meta.accentRaw === '#00ff88' ? '0,255,136' : meta.accentRaw === '#00d4ff' ? '0,212,255' : '191,0,255'},0.08)`
            : 'transparent',
          border: `1px solid ${btnHover ? meta.accent : 'var(--border-subtle)'}`,
          borderRadius: 10,
          padding: '0.75rem 2.5rem',
          cursor: 'pointer',
          transition: 'all 0.25s ease',
          boxShadow: btnHover ? `0 0 16px ${meta.accentRaw}30` : 'none',
          textShadow: btnHover ? meta.diffGlow : 'none',
          animation: 'slideInUp 0.5s ease 0.6s both',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        {isFinalRound ? '⚡ See Final Results' : `▶ Round ${meta.id + 1}`}
      </button>
    </div>
  );
}

// ── HUD Header (round info strip) ────────────────────────────
function RoundHUD({ meta, roundNumber }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      padding: '0.6rem 1rem',
      marginBottom: '1rem',
      animation: 'fadeIn 0.3s ease',
    }}>
      <div style={{
        height: 1, flex: 1,
        background: `linear-gradient(90deg, transparent, ${meta.accentRaw}40)`,
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '0.62rem',
          fontWeight: 700,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}>
          Round {roundNumber}
        </span>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '0.62rem',
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: meta.diffColor,
          textShadow: meta.diffGlow,
          padding: '0.15rem 0.55rem',
          border: `1px solid ${meta.accentRaw}40`,
          borderRadius: 100,
          background: `${meta.accentRaw}10`,
        }}>
          {meta.title}
        </span>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '0.6rem',
          fontWeight: 700,
          letterSpacing: '0.1em',
          color: meta.diffColor,
          opacity: 0.7,
        }}>
          {meta.difficulty}
        </span>
      </div>
      <div style={{
        height: 1, flex: 1,
        background: `linear-gradient(90deg, ${meta.accentRaw}40, transparent)`,
      }} />
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────
export default function GameScreen({ playerName, onGameEnd }) {
  const [currentRound, setCurrentRound] = useState(1);
  const [phase,        setPhase]        = useState(PHASE.INTRO);
  const [humanScore,   setHumanScore]   = useState(0);
  const [aiScore,      setAiScore]      = useState(0);
  const [roundResults, setRoundResults] = useState([]);  // 'human'|'ai'|'draw'
  const [lastWinner,   setLastWinner]   = useState(null);
  const [lastTaunt,    setLastTaunt]    = useState('');
  const [exitAnim,     setExitAnim]     = useState(false);

  const meta = ROUND_META[currentRound - 1];
  const GameComponent = meta.component;

  // Called by each game component when the round finishes
  const handleRoundComplete = useCallback((result) => {
    // result: { winner: 'human'|'ai'|'draw', humanPoints: number, aiPoints: number }
    const winner      = result?.winner      ?? 'draw';
    const humanPoints = result?.humanPoints ?? 0;
    const aiPoints    = result?.aiPoints    ?? 0;

    const newHuman  = humanScore + humanPoints;
    const newAI     = aiScore    + aiPoints;
    const taunt     = getRandomTaunt(winner, currentRound);

    setHumanScore(newHuman);
    setAiScore(newAI);
    setRoundResults(prev => [...prev, winner]);
    setLastWinner(winner);
    setLastTaunt(taunt);
    setExitAnim(true);

    setTimeout(() => {
      setExitAnim(false);
      setPhase(PHASE.ROUND_RESULT);
    }, 300);
  }, [humanScore, aiScore, currentRound]);

  // After round result splash "continue" is clicked
  const handleContinue = useCallback(() => {
    if (currentRound >= TOTAL_ROUNDS) {
      // All rounds done — compute final results
      const finalResults = [...roundResults, lastWinner]; // last result already added
      setPhase(PHASE.DONE);
      // Small delay for the done state to render, then call parent
      setTimeout(() => {
        onGameEnd(humanScore, aiScore, roundResults);
      }, 800);
      return;
    }

    setCurrentRound(r => r + 1);
    setPhase(PHASE.INTRO);
  }, [currentRound, humanScore, aiScore, roundResults, lastWinner, onGameEnd]);

  const handleIntroComplete = useCallback(() => {
    setPhase(PHASE.PLAYING);
  }, []);

  // Keyboard shortcut — Enter to continue from result screen
  useEffect(() => {
    if (phase !== PHASE.ROUND_RESULT) return;
    const handler = (e) => { if (e.key === 'Enter') handleContinue(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, handleContinue]);

  // ── Render ──
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.25rem 1.5rem 3rem',
      maxWidth: 860,
      margin: '0 auto',
      width: '100%',
      position: 'relative',
    }}>

      {/* Accent ambient glow per round */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${meta.accentRaw}08 0%, transparent 70%)`,
        pointerEvents: 'none',
        zIndex: 0,
        transition: 'background 0.8s ease',
      }} />

      {/* Score bar — always visible */}
      <div style={{ position: 'relative', zIndex: 10, marginBottom: '1.25rem' }}>
        <ScoreBar
          playerName={playerName}
          humanScore={humanScore}
          aiScore={aiScore}
          roundResults={roundResults}
          currentRound={currentRound}
        />
      </div>

      {/* ── Phase content ── */}
      <div style={{
        flex: 1,
        position: 'relative',
        zIndex: 5,
        opacity: exitAnim ? 0 : 1,
        transform: exitAnim ? 'scale(0.97) translateY(8px)' : 'none',
        transition: 'opacity 0.28s ease, transform 0.28s ease',
      }}>

        {/* INTRO — countdown before round */}
        {phase === PHASE.INTRO && (
          <RoundIntro
            key={`intro-${currentRound}`}
            meta={meta}
            roundNumber={currentRound}
            onComplete={handleIntroComplete}
          />
        )}

        {/* PLAYING — active game component */}
        {phase === PHASE.PLAYING && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <RoundHUD meta={meta} roundNumber={currentRound} />
            <GameComponent
              key={`game-${currentRound}`}
              playerName={playerName}
              onRoundComplete={handleRoundComplete}
            />
          </div>
        )}

        {/* ROUND_RESULT — who won this round */}
        {phase === PHASE.ROUND_RESULT && (
          <RoundResultSplash
            key={`result-${currentRound}`}
            winner={lastWinner}
            playerName={playerName}
            taunt={lastTaunt}
            meta={meta}
            onContinue={handleContinue}
            isFinalRound={currentRound >= TOTAL_ROUNDS}
          />
        )}

        {/* DONE — brief transitional state */}
        {phase === PHASE.DONE && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '55vh',
            gap: '1.5rem',
            animation: 'fadeIn 0.4s ease',
          }}>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}>
              Battle Complete
            </div>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(2rem, 6vw, 3.5rem)',
              fontWeight: 900,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              background: 'linear-gradient(135deg, var(--neon-green), var(--neon-blue), var(--neon-purple))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 16px rgba(0,212,255,0.5))',
            }}>
              Tallying Results...
            </div>
            {/* Animated dots */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 8, height: 8,
                  borderRadius: '50%',
                  background: 'var(--neon-blue)',
                  boxShadow: 'var(--glow-blue)',
                  animation: `blink 1s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Progress breadcrumb — shown during PLAYING only */}
      {phase === PHASE.PLAYING && (
        <div style={{
          position: 'fixed',
          bottom: '1.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          zIndex: 15,
          background: 'rgba(10,10,20,0.8)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 100,
          padding: '0.4rem 1rem',
          animation: 'fadeIn 0.4s ease',
        }}>
          {ROUND_META.map((r, i) => {
            const done = i < currentRound - 1;
            const active = i === currentRound - 1;
            return (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{
                  width: active ? 28 : 8,
                  height: 8,
                  borderRadius: 100,
                  background: done
                    ? 'var(--neon-green)'
                    : active
                      ? meta.accentRaw
                      : 'rgba(255,255,255,0.08)',
                  boxShadow: active ? `0 0 8px ${meta.accentRaw}` : 'none',
                  transition: 'all 0.4s ease',
                }} />
                {i < ROUND_META.length - 1 && (
                  <div style={{
                    width: 16, height: 1,
                    background: done ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.08)',
                  }} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Inline keyframes */}
      <style>{`
        @keyframes scalePop {
          from { transform: scale(0.6); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}