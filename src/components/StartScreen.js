import { useState, useEffect, useRef } from 'react';

// ── Round preview data ──────────────────────────────────────
const ROUNDS = [
  {
    id: 1,
    label: 'Round 01',
    title: 'Reaction Tap',
    difficulty: 'Easy',
    difficultyColor: 'var(--neon-green)',
    difficultyGlow: '0 0 8px #00ff88, 0 0 20px rgba(0,255,136,0.4)',
    description: 'Pure reflex warfare. A target flashes — tap it before the AI does. Milliseconds decide victory.',
    icon: '⚡',
    accent: 'var(--neon-green)',
    border: 'rgba(0,255,136,0.2)',
    borderHover: 'rgba(0,255,136,0.55)',
    glow: 'rgba(0,255,136,0.08)',
    glowHover: 'rgba(0,255,136,0.14)',
    barColor: 'linear-gradient(90deg, #00ff88, #00cc6a)',
    barGlow: 'rgba(0,255,136,0.6)',
    stat: '< 300ms avg',
    statLabel: 'Reaction window',
  },
  {
    id: 2,
    label: 'Round 02',
    title: 'Reverse Typing',
    difficulty: 'Moderate',
    difficultyColor: 'var(--neon-blue)',
    difficultyGlow: '0 0 8px #00d4ff, 0 0 20px rgba(0,212,255,0.4)',
    description: 'Type the displayed word — but backwards. Speed and accuracy count. Your brain vs pattern recognition.',
    icon: '⌨️',
    accent: 'var(--neon-blue)',
    border: 'rgba(0,212,255,0.2)',
    borderHover: 'rgba(0,212,255,0.55)',
    glow: 'rgba(0,212,255,0.06)',
    glowHover: 'rgba(0,212,255,0.12)',
    barColor: 'linear-gradient(90deg, #00d4ff, #009dbd)',
    barGlow: 'rgba(0,212,255,0.6)',
    stat: '5–8 chars',
    statLabel: 'Word length',
  },
  {
    id: 3,
    label: 'Round 03',
    title: 'Rule Roulette',
    difficulty: 'Hard',
    difficultyColor: 'var(--neon-purple)',
    difficultyGlow: '0 0 8px #bf00ff, 0 0 20px rgba(191,0,255,0.4)',
    description: 'Rules mutate every prompt. Answer under shifting conditions. Adaptability is your only weapon.',
    icon: '🎲',
    accent: 'var(--neon-purple)',
    border: 'rgba(191,0,255,0.2)',
    borderHover: 'rgba(191,0,255,0.55)',
    glow: 'rgba(191,0,255,0.06)',
    glowHover: 'rgba(191,0,255,0.12)',
    barColor: 'linear-gradient(90deg, #bf00ff, #8800cc)',
    barGlow: 'rgba(191,0,255,0.6)',
    stat: '3 mutations',
    statLabel: 'Rule shifts',
  },
];

// ── Particle field (canvas-based) ───────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const COLORS = ['#00ff88', '#00d4ff', '#bf00ff'];
    const N = 55;

    const particles = Array.from({ length: N }, () => ({
      x:  Math.random() * canvas.width,
      y:  Math.random() * canvas.height,
      r:  Math.random() * 1.4 + 0.3,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: Math.random() * 0.5 + 0.15,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Connection lines
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0,212,255,${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Dots
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color.replace(')', `,${p.alpha})`).replace('rgb', 'rgba').replace('#', 'rgba(').replace('rgba(00ff88', 'rgba(0,255,136').replace('rgba(00d4ff', 'rgba(0,212,255').replace('rgba(bf00ff', 'rgba(191,0,255');
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.color;
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}

// ── Round Card ───────────────────────────────────────────────
function RoundCard({ round, index }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: hovered
          ? `linear-gradient(135deg, ${round.glowHover}, rgba(255,255,255,0.02))`
          : `linear-gradient(135deg, ${round.glow}, transparent)`,
        border: `1px solid ${hovered ? round.borderHover : round.border}`,
        borderRadius: 14,
        padding: '1.5rem',
        cursor: 'default',
        transition: 'all 0.3s ease',
        transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered
          ? `0 12px 40px rgba(0,0,0,0.5), 0 0 24px ${round.glow.replace('0.06', '0.2').replace('0.08', '0.25')}`
          : '0 4px 16px rgba(0,0,0,0.3)',
        animation: `slideInUp 0.5s ease both`,
        animationDelay: `${0.5 + index * 0.12}s`,
        overflow: 'hidden',
      }}
    >
      {/* Top-edge shimmer */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 1,
        background: `linear-gradient(90deg, transparent, ${round.accent}, transparent)`,
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.3s',
      }} />

      {/* Round label + difficulty */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '0.62rem',
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}>
          {round.label}
        </span>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '0.6rem',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: round.difficultyColor,
          textShadow: round.difficultyGlow,
          padding: '0.2rem 0.6rem',
          border: `1px solid ${round.border}`,
          borderRadius: 100,
          background: `${round.glow}`,
        }}>
          {round.difficulty}
        </span>
      </div>

      {/* Icon + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.65rem' }}>
        <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{round.icon}</span>
        <h3 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '1.05rem',
          fontWeight: 800,
          letterSpacing: '0.08em',
          color: hovered ? round.accent : 'var(--text-bright)',
          textShadow: hovered ? round.difficultyGlow : 'none',
          transition: 'color 0.3s, text-shadow 0.3s',
          margin: 0,
        }}>
          {round.title}
        </h3>
      </div>

      {/* Description */}
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: '0.87rem',
        fontWeight: 400,
        lineHeight: 1.55,
        color: 'var(--text-secondary)',
        margin: '0 0 1rem 0',
      }}>
        {round.description}
      </p>

      {/* Stat chip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{
          width: 6, height: 6,
          borderRadius: '50%',
          background: round.accent,
          boxShadow: `0 0 6px ${round.accent}`,
          flexShrink: 0,
        }} />
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '0.65rem',
          fontWeight: 700,
          color: round.accent,
          textShadow: round.difficultyGlow,
          letterSpacing: '0.1em',
        }}>
          {round.stat}
        </span>
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
        }}>
          — {round.statLabel}
        </span>
      </div>

      {/* Animated bottom bar */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: 2,
        background: round.barColor,
        boxShadow: `0 0 8px ${round.barGlow}`,
        transform: `scaleX(${hovered ? 1 : 0})`,
        transformOrigin: 'left',
        transition: 'transform 0.35s ease',
        borderRadius: '0 0 14px 14px',
      }} />
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────
export default function StartScreen({ onStart, onLeaderboard }) {
  const [playerName, setPlayerName] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);
  const [lbHovered, setLbHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const trimmed = playerName.trim();
  const canStart = trimmed.length > 0;

  const handleStart = () => {
    if (canStart) onStart(trimmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && canStart) handleStart();
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '2rem 1.5rem 4rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient background blobs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: '-10%', left: '-5%',
          width: '50vw', height: '50vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,255,136,0.04) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-15%', right: '-10%',
          width: '60vw', height: '60vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(191,0,255,0.05) 0%, transparent 65%)',
        }} />
        <div style={{
          position: 'absolute', top: '40%', left: '50%', transform: 'translateX(-50%)',
          width: '70vw', height: '30vw',
          background: 'radial-gradient(ellipse, rgba(0,212,255,0.03) 0%, transparent 70%)',
        }} />
      </div>

      {/* Particle network */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <ParticleCanvas />
      </div>

      {/* ── Content ── */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 860,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 0,
      }}>

        {/* ── Header ── */}
        <header style={{
          textAlign: 'center',
          marginBottom: '2.5rem',
          animation: mounted ? 'slideInUp 0.6s ease both' : 'none',
        }}>
          {/* Eye-brow */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            marginBottom: '1.2rem',
            padding: '0.3rem 1rem',
            border: '1px solid rgba(0,212,255,0.2)',
            borderRadius: 100,
            background: 'rgba(0,212,255,0.06)',
            animation: mounted ? 'slideInUp 0.5s ease 0.1s both' : 'none',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--neon-green)',
              boxShadow: 'var(--glow-green)',
              display: 'inline-block',
              animation: 'roundPing 1.8s ease-in-out infinite',
            }} />
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '0.62rem',
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--text-secondary)',
            }}>
              Human Intelligence Challenge
            </span>
          </div>

          {/* Main Title */}
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 900,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontSize: 'clamp(2.2rem, 7vw, 4.5rem)',
            lineHeight: 1.05,
            marginBottom: '0.4rem',
            animation: mounted ? 'slideInUp 0.6s ease 0.15s both' : 'none',
          }}>
            <span style={{
              display: 'block',
              background: 'linear-gradient(135deg, var(--neon-green) 0%, var(--neon-blue) 55%, var(--neon-purple) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 16px rgba(0,212,255,0.5))',
            }}>
              NeuroClash
            </span>
          </h1>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            animation: mounted ? 'slideInUp 0.6s ease 0.22s both' : 'none',
          }}>
            <div style={{ height: 1, width: 50, background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.4))' }} />
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(0.75rem, 2vw, 1rem)',
              fontWeight: 600,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'var(--text-secondary)',
            }}>
              AI <span style={{ color: 'var(--neon-purple)', textShadow: 'var(--glow-purple)' }}>vs</span> Human
            </span>
            <div style={{ height: 1, width: 50, background: 'linear-gradient(90deg, rgba(0,212,255,0.4), transparent)' }} />
          </div>

          {/* Sub-tagline */}
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.95rem',
            fontWeight: 400,
            color: 'var(--text-muted)',
            marginTop: '1rem',
            letterSpacing: '0.03em',
            animation: mounted ? 'slideInUp 0.6s ease 0.3s both' : 'none',
          }}>
            Three rounds. Three disciplines. One winner.
          </p>
        </header>

        {/* ── Round Previews ── */}
        <section style={{
          width: '100%',
          marginBottom: '2.5rem',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem',
          }}>
            {ROUNDS.map((round, i) => (
              <RoundCard key={round.id} round={round} index={i} />
            ))}
          </div>
        </section>

        {/* ── Player Entry Panel ── */}
        <div style={{
          width: '100%',
          maxWidth: 480,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          animation: 'slideInUp 0.6s ease 0.75s both',
        }}>
          {/* Name input */}
          <div style={{ width: '100%' }}>
            <label style={{
              display: 'block',
              fontFamily: 'var(--font-heading)',
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: inputFocused ? 'var(--neon-blue)' : 'var(--text-muted)',
              marginBottom: '0.5rem',
              transition: 'color 0.2s',
            }}>
              Enter your callsign
            </label>

            <div style={{ position: 'relative' }}>
              {/* Left accent bar */}
              <div style={{
                position: 'absolute',
                left: 0, top: 0, bottom: 0,
                width: 3,
                borderRadius: '4px 0 0 4px',
                background: inputFocused
                  ? 'linear-gradient(180deg, var(--neon-green), var(--neon-blue))'
                  : 'var(--border-subtle)',
                transition: 'background 0.3s',
                boxShadow: inputFocused ? 'var(--glow-blue)' : 'none',
              }} />

              <input
                ref={inputRef}
                type="text"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                onKeyDown={handleKeyDown}
                maxLength={20}
                placeholder="e.g. NeuralNinja"
                autoComplete="off"
                spellCheck={false}
                style={{
                  width: '100%',
                  fontFamily: 'var(--font-body)',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  background: inputFocused ? 'rgba(12,12,30,0.98)' : 'var(--bg-input)',
                  border: `1px solid ${inputFocused ? 'var(--neon-blue)' : 'var(--border-subtle)'}`,
                  borderRadius: '0 8px 8px 0',
                  padding: '0.85rem 3rem 0.85rem 1.2rem',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  caretColor: 'var(--neon-green)',
                  boxShadow: inputFocused
                    ? '0 0 0 2px rgba(0,212,255,0.12), 0 0 20px rgba(0,212,255,0.12)'
                    : 'none',
                  letterSpacing: '0.03em',
                  marginLeft: 3,
                  width: 'calc(100% - 3px)',
                }}
              />

              {/* Char counter */}
              {playerName.length > 0 && (
                <span style={{
                  position: 'absolute',
                  right: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  color: playerName.length >= 18 ? 'var(--neon-yellow)' : 'var(--text-muted)',
                  letterSpacing: '0.05em',
                  transition: 'color 0.2s',
                }}>
                  {playerName.length}/20
                </span>
              )}
            </div>

            {/* Hint text */}
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              marginTop: '0.4rem',
              paddingLeft: 4,
            }}>
              {canStart
                ? `Ready to battle, ${trimmed}? Hit Start Game ↓`
                : 'Your name will appear on the leaderboard.'}
            </p>
          </div>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>

            {/* Start Game */}
            <button
              onClick={handleStart}
              disabled={!canStart}
              onMouseEnter={() => setBtnHovered(true)}
              onMouseLeave={() => setBtnHovered(false)}
              style={{
                width: '100%',
                fontFamily: 'var(--font-heading)',
                fontSize: '0.95rem',
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: canStart ? 'var(--neon-green)' : 'var(--text-muted)',
                background: canStart
                  ? btnHovered
                    ? 'linear-gradient(135deg, rgba(0,255,136,0.22), rgba(0,255,136,0.08))'
                    : 'linear-gradient(135deg, rgba(0,255,136,0.14), rgba(0,255,136,0.04))'
                  : 'rgba(255,255,255,0.03)',
                border: `1px solid ${canStart ? 'var(--neon-green)' : 'var(--border-subtle)'}`,
                borderRadius: 10,
                padding: '1rem 2rem',
                cursor: canStart ? 'pointer' : 'not-allowed',
                transition: 'all 0.25s ease',
                transform: canStart && btnHovered ? 'translateY(-2px)' : 'none',
                boxShadow: canStart
                  ? btnHovered
                    ? 'var(--glow-green), inset 0 0 24px rgba(0,255,136,0.08)'
                    : '0 0 14px rgba(0,255,136,0.2)'
                  : 'none',
                textShadow: canStart && btnHovered ? 'var(--glow-green)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                position: 'relative',
                overflow: 'hidden',
                opacity: canStart ? 1 : 0.45,
              }}
            >
              {/* Shimmer sweep on hover */}
              {canStart && btnHovered && (
                <span style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(105deg, transparent 30%, rgba(0,255,136,0.07) 50%, transparent 70%)',
                  animation: 'shimmerSweep 0.7s ease forwards',
                  pointerEvents: 'none',
                }} />
              )}
              <span style={{ fontSize: '1.1rem' }}>▶</span>
              Start Game
            </button>

            {/* Leaderboard */}
            <button
              onClick={onLeaderboard}
              onMouseEnter={() => setLbHovered(true)}
              onMouseLeave={() => setLbHovered(false)}
              style={{
                width: '100%',
                fontFamily: 'var(--font-heading)',
                fontSize: '0.82rem',
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: lbHovered ? 'var(--neon-blue)' : 'var(--text-secondary)',
                background: lbHovered ? 'rgba(0,212,255,0.07)' : 'transparent',
                border: `1px solid ${lbHovered ? 'rgba(0,212,255,0.4)' : 'var(--border-subtle)'}`,
                borderRadius: 10,
                padding: '0.8rem 2rem',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                transform: lbHovered ? 'translateY(-1px)' : 'none',
                boxShadow: lbHovered ? '0 0 14px rgba(0,212,255,0.12)' : 'none',
                textShadow: lbHovered ? 'var(--glow-blue)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.55rem',
              }}
            >
              <span>🏆</span>
              View Leaderboard
            </button>
          </div>
        </div>

        {/* ── Footer note ── */}
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          textAlign: 'center',
          marginTop: '2.5rem',
          letterSpacing: '0.04em',
          animation: 'slideInUp 0.6s ease 1s both',
        }}>
          Best of 3 rounds &nbsp;·&nbsp; No ties allowed &nbsp;·&nbsp; May the better mind win
        </p>
      </div>

      {/* Shimmer sweep keyframe injected inline */}
      <style>{`
        @keyframes shimmerSweep {
          from { transform: translateX(-100%); }
          to   { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}