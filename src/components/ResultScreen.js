import { useState, useEffect, useRef, useCallback } from 'react';
import { getRandomTaunt } from '../utils/aiTaunts';

// ── Constants ────────────────────────────────────────────────
const ROUND_META = [
  { id: 1, title: 'Reaction Tap',   difficulty: 'Easy',     accent: '#00ff88', glow: '0 0 8px #00ff88, 0 0 20px rgba(0,255,136,0.4)' },
  { id: 2, title: 'Reverse Typing', difficulty: 'Moderate', accent: '#00d4ff', glow: '0 0 8px #00d4ff, 0 0 20px rgba(0,212,255,0.4)' },
  { id: 3, title: 'Rule Roulette',  difficulty: 'Hard',     accent: '#bf00ff', glow: '0 0 8px #bf00ff, 0 0 20px rgba(191,0,255,0.4)' },
];

// ── Save score to localStorage ───────────────────────────────
function saveScore({ playerName, humanScore, aiScore, roundResults, didWin }) {
  try {
    const existing = JSON.parse(localStorage.getItem('neuroclash_leaderboard') || '[]');
    const entry = {
      id:           Date.now(),
      playerName,
      humanScore,
      aiScore,
      roundResults,
      didWin,
      date:         new Date().toISOString(),
    };
    const updated = [entry, ...existing].slice(0, 50); // cap at 50 entries
    localStorage.setItem('neuroclash_leaderboard', JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
}

// ── Confetti particle system (CSS-only, canvas-free) ─────────
function Confetti({ active }) {
  const particles = useRef(
    Array.from({ length: 60 }, (_, i) => ({
      id:       i,
      left:     `${Math.random() * 100}%`,
      delay:    `${Math.random() * 1.4}s`,
      duration: `${2.2 + Math.random() * 2}s`,
      size:     `${5 + Math.random() * 7}px`,
      color:    ['#00ff88', '#00d4ff', '#bf00ff', '#ffe600', '#ffffff'][Math.floor(Math.random() * 5)],
      drift:    `${(Math.random() - 0.5) * 120}px`,
      rotate:   `${Math.random() * 720}deg`,
      shape:    Math.random() > 0.5 ? '50%' : '2px',
    }))
  ).current;

  if (!active) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50, overflow: 'hidden' }}>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position:    'absolute',
            top:         '-20px',
            left:        p.left,
            width:       p.size,
            height:      p.size,
            borderRadius: p.shape,
            background:  p.color,
            boxShadow:   `0 0 6px ${p.color}`,
            animation:   `confettiFall ${p.duration} ${p.delay} ease-in forwards`,
            '--drift':   p.drift,
            '--rotate':  p.rotate,
          }}
        />
      ))}
    </div>
  );
}

// ── Glitch text effect ───────────────────────────────────────
function GlitchText({ text, color, style = {} }) {
  return (
    <span
      data-text={text}
      style={{
        position:   'relative',
        display:    'inline-block',
        color,
        ...style,
      }}
    >
      {text}
      <span aria-hidden style={{
        position:    'absolute',
        inset:       0,
        color,
        opacity:     0.7,
        animation:   'glitchTop 3s infinite',
        clipPath:    'polygon(0 0, 100% 0, 100% 35%, 0 35%)',
        filter:      'blur(0.4px)',
        left:        2,
        top:         -2,
      }}>
        {text}
      </span>
      <span aria-hidden style={{
        position:    'absolute',
        inset:       0,
        color,
        opacity:     0.6,
        animation:   'glitchBot 3s infinite 0.15s',
        clipPath:    'polygon(0 65%, 100% 65%, 100% 100%, 0 100%)',
        filter:      'blur(0.4px)',
        left:        -2,
        top:         2,
      }}>
        {text}
      </span>
    </span>
  );
}

// ── Animated score counter ────────────────────────────────────
function AnimatedNumber({ target, duration = 1200, color, glow }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const start = performance.now();
    const tick = (now) => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out-expo
      const eased    = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return (
    <span style={{ color, textShadow: glow }}>{display}</span>
  );
}

// ── Round breakdown row ──────────────────────────────────────
function RoundRow({ meta, result, index, playerName }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 600 + index * 150);
    return () => clearTimeout(t);
  }, [index]);

  const isHuman = result === 'human';
  const isDraw  = result === 'draw';

  const winColor  = isDraw ? '#ffe600'  : isHuman ? '#00ff88'  : '#ff003c';
  const winGlow   = isDraw ? '0 0 8px #ffe600, 0 0 20px rgba(255,230,0,0.4)'
                           : isHuman
                             ? '0 0 8px #00ff88, 0 0 20px rgba(0,255,136,0.4)'
                             : '0 0 8px #ff003c, 0 0 20px rgba(255,0,60,0.4)';
  const winLabel  = isDraw ? 'DRAW' : isHuman ? `${playerName}` : 'AI';
  const winIcon   = isDraw ? '⚖️' : isHuman ? '🧠' : '🤖';

  return (
    <div style={{
      display:         'flex',
      alignItems:      'center',
      gap:             '1rem',
      padding:         '0.9rem 1.25rem',
      background:      visible ? `${meta.accent}08` : 'transparent',
      border:          `1px solid ${visible ? meta.accent + '30' : 'transparent'}`,
      borderRadius:    10,
      transition:      'all 0.5s ease',
      opacity:         visible ? 1 : 0,
      transform:       visible ? 'none' : 'translateX(-20px)',
    }}>
      {/* Round number */}
      <div style={{
        fontFamily:   'var(--font-heading)',
        fontSize:     '0.6rem',
        fontWeight:   700,
        letterSpacing:'0.18em',
        textTransform:'uppercase',
        color:        meta.accent,
        textShadow:   meta.glow,
        minWidth:     52,
      }}>
        R{meta.id}
      </div>

      {/* Left accent bar */}
      <div style={{
        width:        3,
        height:       36,
        borderRadius: 100,
        background:   meta.accent,
        boxShadow:    meta.glow,
        flexShrink:   0,
      }} />

      {/* Round title + difficulty */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily:   'var(--font-heading)',
          fontSize:     '0.82rem',
          fontWeight:   700,
          color:        'var(--text-bright)',
          letterSpacing:'0.04em',
        }}>
          {meta.title}
        </div>
        <div style={{
          fontFamily:   'var(--font-body)',
          fontSize:     '0.72rem',
          color:        'var(--text-muted)',
          marginTop:    2,
        }}>
          {meta.difficulty}
        </div>
      </div>

      {/* Winner chip */}
      <div style={{
        display:       'flex',
        alignItems:    'center',
        gap:           '0.4rem',
        fontFamily:    'var(--font-heading)',
        fontSize:      '0.72rem',
        fontWeight:    700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color:         winColor,
        textShadow:    winGlow,
        padding:       '0.3rem 0.8rem',
        border:        `1px solid ${winColor}40`,
        borderRadius:  100,
        background:    `${winColor}10`,
        whiteSpace:    'nowrap',
      }}>
        <span>{winIcon}</span>
        {winLabel}
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────
export default function ResultScreen({
  playerName,
  humanScore,
  aiScore,
  roundResults = [],
  onPlayAgain,
  onLeaderboard,
}) {
  const [phase,        setPhase]        = useState('reveal'); // 'reveal' | 'stats' | 'full'
  const [saved,        setSaved]        = useState(false);
  const [playHover,    setPlayHover]    = useState(false);
  const [lbHover,      setLbHover]      = useState(false);
  const [confettiOn,   setConfettiOn]   = useState(false);
  const [taunt,        setTaunt]        = useState('');

  const isHumanWinner = humanScore > aiScore;
  const isDraw        = humanScore === aiScore;
  const isAiWinner    = aiScore    > humanScore;

  const overallWinner = isDraw ? 'draw' : isHumanWinner ? 'human' : 'ai';

  // Save score + set up taunts on mount
  useEffect(() => {
    const ok = saveScore({ playerName, humanScore, aiScore, roundResults, didWin: isHumanWinner });
    setSaved(ok);

    if (isAiWinner) {
      setTaunt(getRandomTaunt('ai', 'final'));
    }

    // Staggered reveal phases
    const t1 = setTimeout(() => setPhase('stats'), 800);
    const t2 = setTimeout(() => setPhase('full'),  1600);
    const t3 = isHumanWinner ? setTimeout(() => setConfettiOn(true), 900) : null;
    const t4 = isHumanWinner ? setTimeout(() => setConfettiOn(false), 6000) : null;

    return () => { clearTimeout(t1); clearTimeout(t2); if (t3) clearTimeout(t3); if (t4) clearTimeout(t4); };
  }, []);

  // Winner config
  const winnerColor = isDraw ? '#ffe600'  : isHumanWinner ? '#00ff88'  : '#ff003c';
  const winnerGlow  = isDraw
    ? '0 0 12px #ffe600, 0 0 40px rgba(255,230,0,0.5), 0 0 80px rgba(255,230,0,0.2)'
    : isHumanWinner
      ? '0 0 12px #00ff88, 0 0 40px rgba(0,255,136,0.5), 0 0 80px rgba(0,255,136,0.2)'
      : '0 0 12px #ff003c, 0 0 40px rgba(255,0,60,0.5),  0 0 80px rgba(255,0,60,0.2)';
  const winnerBg    = isDraw
    ? 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(255,230,0,0.06) 0%, transparent 70%)'
    : isHumanWinner
      ? 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,255,136,0.07) 0%, transparent 70%)'
      : 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(255,0,60,0.06) 0%, transparent 70%)';

  const winnerLabel = isDraw ? 'DRAW' : isHumanWinner ? 'VICTORY' : 'DEFEATED';
  const winnerName  = isDraw ? 'No one wins' : isHumanWinner ? playerName : 'The Machine';
  const subMessage  = isDraw
    ? 'Perfectly matched. Human and AI — equals.'
    : isHumanWinner
      ? 'Human cognition prevails. For now.'
      : 'The algorithm was merciless.';

  return (
    <div style={{
      minHeight:      '100vh',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      padding:        '2rem 1.5rem 4rem',
      position:       'relative',
      overflow:       'hidden',
    }}>
      {/* Ambient winner glow */}
      <div style={{
        position:       'fixed',
        inset:          0,
        background:     winnerBg,
        pointerEvents:  'none',
        zIndex:         0,
        transition:     'background 1s ease',
      }} />

      {/* Scanline overlay */}
      <div style={{
        position:      'fixed',
        inset:         0,
        background:    'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
        pointerEvents: 'none',
        zIndex:        1,
      }} />

      {/* Confetti */}
      <Confetti active={confettiOn} />

      {/* ── Content ── */}
      <div style={{
        position:       'relative',
        zIndex:         5,
        width:          '100%',
        maxWidth:       620,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        gap:            0,
      }}>

        {/* ── Winner Announcement ── */}
        <section style={{
          textAlign:  'center',
          marginBottom: '2.5rem',
          width:      '100%',
        }}>
          {/* Eye-brow */}
          <div style={{
            fontFamily:    'var(--font-heading)',
            fontSize:      '0.62rem',
            fontWeight:    700,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color:         'var(--text-muted)',
            marginBottom:  '1.2rem',
            animation:     'slideInUp 0.5s ease both',
          }}>
            NeuroClash — Final Result
          </div>

          {/* Big win/lose word */}
          <div style={{
            fontFamily:    'var(--font-heading)',
            fontSize:      'clamp(3rem, 12vw, 7rem)',
            fontWeight:    900,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            lineHeight:    1,
            marginBottom:  '0.6rem',
            animation:     'resultReveal 0.7s cubic-bezier(0.175,0.885,0.32,1.275) 0.2s both',
          }}>
            <GlitchText
              text={winnerLabel}
              color={winnerColor}
              style={{ textShadow: winnerGlow }}
            />
          </div>

          {/* Winner name */}
          <div style={{
            fontFamily:    'var(--font-heading)',
            fontSize:      'clamp(1rem, 3.5vw, 1.8rem)',
            fontWeight:    700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color:         winnerColor,
            textShadow:    winnerGlow,
            marginBottom:  '0.6rem',
            animation:     'slideInUp 0.5s ease 0.5s both',
          }}>
            {winnerName}
          </div>

          {/* Sub-message */}
          <p style={{
            fontFamily:  'var(--font-body)',
            fontSize:    '0.95rem',
            color:       'var(--text-secondary)',
            margin:      0,
            animation:   'slideInUp 0.5s ease 0.65s both',
          }}>
            {subMessage}
          </p>
        </section>

        {/* ── Score Panel ── */}
        {phase !== 'reveal' && (
          <div style={{
            width:          '100%',
            background:     'rgba(10,10,25,0.85)',
            border:         '1px solid rgba(0,212,255,0.15)',
            borderRadius:   16,
            overflow:       'hidden',
            marginBottom:   '1.5rem',
            animation:      'slideInUp 0.5s ease both',
            boxShadow:      '0 16px 48px rgba(0,0,0,0.5)',
          }}>
            {/* Score top strip */}
            <div style={{
              display:     'grid',
              gridTemplateColumns: '1fr auto 1fr',
              alignItems:  'center',
              padding:     '1.5rem 2rem',
              gap:         '1rem',
              borderBottom:'1px solid rgba(255,255,255,0.05)',
              background:  'linear-gradient(135deg, rgba(0,255,136,0.04), rgba(0,212,255,0.04))',
            }}>
              {/* Human */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{
                  fontFamily:    'var(--font-heading)',
                  fontSize:      '0.6rem',
                  fontWeight:    700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color:         isHumanWinner ? '#00ff88' : 'var(--text-muted)',
                  marginBottom:  4,
                  display:       'flex',
                  alignItems:    'center',
                  gap:           '0.4rem',
                }}>
                  🧠 {playerName}
                  {isHumanWinner && <span style={{ color: '#00ff88', textShadow: '0 0 8px #00ff88' }}>★</span>}
                </span>
                <span style={{
                  fontFamily:    'var(--font-heading)',
                  fontSize:      'clamp(2.5rem, 7vw, 4rem)',
                  fontWeight:    900,
                  lineHeight:    1,
                  display:       'block',
                }}>
                  <AnimatedNumber
                    target={humanScore}
                    duration={1000}
                    color="#00ff88"
                    glow="0 0 12px #00ff88, 0 0 30px rgba(0,255,136,0.5)"
                  />
                </span>
                <span style={{
                  fontFamily:    'var(--font-body)',
                  fontSize:      '0.72rem',
                  color:         'var(--text-muted)',
                  marginTop:     2,
                }}>
                  round wins
                </span>
              </div>

              {/* VS divider */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  fontFamily:    'var(--font-heading)',
                  fontSize:      '1.2rem',
                  fontWeight:    900,
                  color:         isDraw ? '#ffe600' : 'var(--neon-purple)',
                  textShadow:    isDraw ? '0 0 12px #ffe600' : 'var(--glow-purple)',
                  letterSpacing: '0.1em',
                  animation:     'vsPulse 2s ease-in-out infinite',
                }}>
                  VS
                </div>
                {!isDraw && (
                  <div style={{
                    fontFamily:    'var(--font-heading)',
                    fontSize:      '0.52rem',
                    fontWeight:    700,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color:         winnerColor,
                    textShadow:    winnerGlow,
                    whiteSpace:    'nowrap',
                    padding:       '0.2rem 0.5rem',
                    border:        `1px solid ${winnerColor}40`,
                    borderRadius:  100,
                    background:    `${winnerColor}10`,
                  }}>
                    {isHumanWinner ? 'Human wins' : 'AI wins'}
                  </div>
                )}
              </div>

              {/* AI */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{
                  fontFamily:    'var(--font-heading)',
                  fontSize:      '0.6rem',
                  fontWeight:    700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color:         isAiWinner ? '#00d4ff' : 'var(--text-muted)',
                  marginBottom:  4,
                  display:       'flex',
                  alignItems:    'center',
                  gap:           '0.4rem',
                }}>
                  {isAiWinner && <span style={{ color: '#00d4ff', textShadow: '0 0 8px #00d4ff' }}>★</span>}
                  AI 🤖
                </span>
                <span style={{
                  fontFamily:    'var(--font-heading)',
                  fontSize:      'clamp(2.5rem, 7vw, 4rem)',
                  fontWeight:    900,
                  lineHeight:    1,
                  display:       'block',
                  textAlign:     'right',
                }}>
                  <AnimatedNumber
                    target={aiScore}
                    duration={1000}
                    color="#00d4ff"
                    glow="0 0 12px #00d4ff, 0 0 30px rgba(0,212,255,0.5)"
                  />
                </span>
                <span style={{
                  fontFamily:    'var(--font-body)',
                  fontSize:      '0.72rem',
                  color:         'var(--text-muted)',
                  marginTop:     2,
                }}>
                  round wins
                </span>
              </div>
            </div>

            {/* Round breakdown */}
            <div style={{ padding: '1.25rem 1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{
                fontFamily:    'var(--font-heading)',
                fontSize:      '0.6rem',
                fontWeight:    700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color:         'var(--text-muted)',
                marginBottom:  '0.4rem',
                paddingLeft:   4,
              }}>
                Round Breakdown
              </div>
              {ROUND_META.map((meta, i) => (
                <RoundRow
                  key={meta.id}
                  meta={meta}
                  result={roundResults[i] ?? 'draw'}
                  index={i}
                  playerName={playerName}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── AI Taunt (if AI wins) ── */}
        {phase === 'full' && isAiWinner && taunt && (
          <div style={{
            width:          '100%',
            marginBottom:   '1.5rem',
            animation:      'slideInUp 0.5s ease 0.2s both',
          }}>
            <div style={{
              background:   'rgba(255,0,60,0.05)',
              border:       '1px solid rgba(255,0,60,0.2)',
              borderRadius: 12,
              padding:      '1.2rem 1.5rem',
              position:     'relative',
            }}>
              <div style={{
                position:      'absolute',
                top:           -10, left: 16,
                background:    'var(--bg-primary)',
                padding:       '0 0.6rem',
                fontFamily:    'var(--font-heading)',
                fontSize:      '0.55rem',
                fontWeight:    700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color:         'var(--neon-red, #ff003c)',
                textShadow:    '0 0 8px #ff003c',
              }}>
                AI final taunt
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.4rem', flexShrink: 0, marginTop: 2 }}>🤖</span>
                <p style={{
                  fontFamily:  'var(--font-body)',
                  fontSize:    '0.95rem',
                  fontWeight:  500,
                  fontStyle:   'italic',
                  color:       'var(--text-primary)',
                  margin:      0,
                  lineHeight:  1.6,
                }}>
                  "{taunt}"
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Human wins message ── */}
        {phase === 'full' && isHumanWinner && (
          <div style={{
            width:          '100%',
            marginBottom:   '1.5rem',
            animation:      'slideInUp 0.5s ease 0.2s both',
          }}>
            <div style={{
              background:   'rgba(0,255,136,0.05)',
              border:       '1px solid rgba(0,255,136,0.2)',
              borderRadius: 12,
              padding:      '1.2rem 1.5rem',
              position:     'relative',
              overflow:     'hidden',
            }}>
              {/* Animated shimmer bar */}
              <div style={{
                position:   'absolute',
                inset:      0,
                background: 'linear-gradient(105deg, transparent 30%, rgba(0,255,136,0.04) 50%, transparent 70%)',
                animation:  'shimmerLoop 2.5s ease-in-out infinite',
              }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}>
                <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>🧠</span>
                <div>
                  <div style={{
                    fontFamily:    'var(--font-heading)',
                    fontSize:      '0.72rem',
                    fontWeight:    700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color:         '#00ff88',
                    textShadow:    '0 0 8px #00ff88, 0 0 20px rgba(0,255,136,0.4)',
                    marginBottom:  4,
                  }}>
                    Human Intelligence Confirmed
                  </div>
                  <p style={{
                    fontFamily:  'var(--font-body)',
                    fontSize:    '0.9rem',
                    color:       'var(--text-secondary)',
                    margin:      0,
                    lineHeight:  1.5,
                  }}>
                    {playerName} outperformed the algorithm across {humanScore} round{humanScore !== 1 ? 's' : ''}.
                    The AI will recalibrate and return stronger. Can you do it again?
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Draw message ── */}
        {phase === 'full' && isDraw && (
          <div style={{
            width:          '100%',
            marginBottom:   '1.5rem',
            animation:      'slideInUp 0.5s ease 0.2s both',
          }}>
            <div style={{
              background:   'rgba(255,230,0,0.04)',
              border:       '1px solid rgba(255,230,0,0.2)',
              borderRadius: 12,
              padding:      '1.2rem 1.5rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>⚖️</span>
                <p style={{
                  fontFamily:  'var(--font-body)',
                  fontSize:    '0.9rem',
                  color:       'var(--text-secondary)',
                  margin:      0,
                  lineHeight:  1.5,
                }}>
                  A perfect tie. The line between carbon and silicon blurs.
                  One more game will decide the true champion.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── CTA Buttons ── */}
        {phase === 'full' && (
          <div style={{
            width:          '100%',
            display:        'flex',
            flexDirection:  'column',
            gap:            '0.75rem',
            animation:      'slideInUp 0.5s ease 0.4s both',
          }}>
            {/* Play Again */}
            <button
              onClick={onPlayAgain}
              onMouseEnter={() => setPlayHover(true)}
              onMouseLeave={() => setPlayHover(false)}
              style={{
                width:         '100%',
                fontFamily:    'var(--font-heading)',
                fontSize:      '0.92rem',
                fontWeight:    700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color:         '#00ff88',
                background:    playHover
                  ? 'linear-gradient(135deg, rgba(0,255,136,0.22), rgba(0,255,136,0.08))'
                  : 'linear-gradient(135deg, rgba(0,255,136,0.12), rgba(0,255,136,0.04))',
                border:        '1px solid #00ff88',
                borderRadius:  10,
                padding:       '1rem 2rem',
                cursor:        'pointer',
                transition:    'all 0.25s ease',
                transform:     playHover ? 'translateY(-2px)' : 'none',
                boxShadow:     playHover
                  ? '0 0 12px #00ff88, 0 0 30px rgba(0,255,136,0.3), inset 0 0 20px rgba(0,255,136,0.07)'
                  : '0 0 10px rgba(0,255,136,0.15)',
                textShadow:    playHover ? '0 0 8px #00ff88, 0 0 20px rgba(0,255,136,0.4)' : 'none',
                display:       'flex',
                alignItems:    'center',
                justifyContent:'center',
                gap:           '0.6rem',
                position:      'relative',
                overflow:      'hidden',
              }}
            >
              {playHover && (
                <span style={{
                  position:   'absolute',
                  inset:      0,
                  background: 'linear-gradient(105deg, transparent 30%, rgba(0,255,136,0.07) 50%, transparent 70%)',
                  animation:  'shimmerSweep 0.7s ease forwards',
                  pointerEvents: 'none',
                }} />
              )}
              <span>↺</span>
              Play Again
            </button>

            {/* Leaderboard */}
            <button
              onClick={onLeaderboard}
              onMouseEnter={() => setLbHover(true)}
              onMouseLeave={() => setLbHover(false)}
              style={{
                width:         '100%',
                fontFamily:    'var(--font-heading)',
                fontSize:      '0.82rem',
                fontWeight:    600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color:         lbHover ? '#00d4ff' : 'var(--text-secondary)',
                background:    lbHover ? 'rgba(0,212,255,0.07)' : 'transparent',
                border:        `1px solid ${lbHover ? 'rgba(0,212,255,0.4)' : 'var(--border-subtle)'}`,
                borderRadius:  10,
                padding:       '0.8rem 2rem',
                cursor:        'pointer',
                transition:    'all 0.25s ease',
                transform:     lbHover ? 'translateY(-1px)' : 'none',
                boxShadow:     lbHover ? '0 0 14px rgba(0,212,255,0.12)' : 'none',
                textShadow:    lbHover ? 'var(--glow-blue)' : 'none',
                display:       'flex',
                alignItems:    'center',
                justifyContent:'center',
                gap:           '0.5rem',
              }}
            >
              🏆 View Leaderboard
              {saved && (
                <span style={{
                  fontFamily:    'var(--font-heading)',
                  fontSize:      '0.52rem',
                  fontWeight:    700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color:         '#00ff88',
                  textShadow:    '0 0 6px #00ff88',
                  padding:       '0.15rem 0.45rem',
                  border:        '1px solid rgba(0,255,136,0.3)',
                  borderRadius:  100,
                  background:    'rgba(0,255,136,0.08)',
                  marginLeft:    4,
                }}>
                  Score saved
                </span>
              )}
            </button>
          </div>
        )}

        {/* Footer */}
        <p style={{
          fontFamily:    'var(--font-body)',
          fontSize:      '0.7rem',
          color:         'var(--text-muted)',
          textAlign:     'center',
          marginTop:     '2rem',
          letterSpacing: '0.04em',
          opacity:       phase === 'full' ? 1 : 0,
          transition:    'opacity 0.5s ease 1s',
        }}>
          NeuroClash &nbsp;·&nbsp; Best of 3 &nbsp;·&nbsp; Score automatically saved
        </p>
      </div>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) translateX(0) rotate(0deg);        opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(110vh) translateX(var(--drift)) rotate(var(--rotate)); opacity: 0; }
        }
        @keyframes glitchTop {
          0%,  90%, 100% { transform: none;         opacity: 0; }
          91%             { transform: translate(-2px,-1px) skewX(-2deg); opacity: 0.7; }
          93%             { transform: translate(2px, 1px) skewX(2deg);  opacity: 0; }
          95%             { transform: translate(-1px,0)  skewX(-1deg); opacity: 0.6; }
          97%             { transform: none;         opacity: 0; }
        }
        @keyframes glitchBot {
          0%,  88%, 100% { transform: none;         opacity: 0; }
          89%             { transform: translate(2px, 1px) skewX(3deg);  opacity: 0.6; }
          91%             { transform: translate(-2px,-1px) skewX(-3deg); opacity: 0; }
          93%             { transform: translate(1px, 0) skewX(1deg);    opacity: 0.5; }
          95%             { transform: none;         opacity: 0; }
        }
        @keyframes shimmerLoop {
          0%   { transform: translateX(-100%); }
          60%  { transform: translateX(200%); }
          100% { transform: translateX(200%); }
        }
        @keyframes shimmerSweep {
          from { transform: translateX(-100%); }
          to   { transform: translateX(250%); }
        }
      `}</style>
    </div>
  );
}