import { useState, useEffect, useRef } from 'react';

const ROUNDS = [
  {
    id: 1, label: 'Round 01', title: 'Reaction Tap', difficulty: 'Easy',
    difficultyColor: 'var(--neon-green)',
    difficultyGlow: '0 0 8px #00ff88, 0 0 20px rgba(0,255,136,0.4)',
    description: 'Pure reflex warfare. A target flashes — tap it before the AI does. Milliseconds decide victory.',
    icon: '⚡', accent: 'var(--neon-green)',
    border: 'rgba(0,255,136,0.2)', borderHover: 'rgba(0,255,136,0.55)',
    glow: 'rgba(0,255,136,0.08)', glowHover: 'rgba(0,255,136,0.14)',
    barColor: 'linear-gradient(90deg, #00ff88, #00cc6a)', barGlow: 'rgba(0,255,136,0.6)',
    stat: '< 300ms avg', statLabel: 'Reaction window',
  },
  {
    id: 2, label: 'Round 02', title: 'Reverse Typing', difficulty: 'Moderate',
    difficultyColor: 'var(--neon-blue)',
    difficultyGlow: '0 0 8px #00d4ff, 0 0 20px rgba(0,212,255,0.4)',
    description: 'Type the displayed word — but backwards. Speed and accuracy count. Your brain vs pattern recognition.',
    icon: '⌨️', accent: 'var(--neon-blue)',
    border: 'rgba(0,212,255,0.2)', borderHover: 'rgba(0,212,255,0.55)',
    glow: 'rgba(0,212,255,0.06)', glowHover: 'rgba(0,212,255,0.12)',
    barColor: 'linear-gradient(90deg, #00d4ff, #009dbd)', barGlow: 'rgba(0,212,255,0.6)',
    stat: '5–8 chars', statLabel: 'Word length',
  },
  {
    id: 3, label: 'Round 03', title: 'Rule Roulette', difficulty: 'Hard',
    difficultyColor: 'var(--neon-purple)',
    difficultyGlow: '0 0 8px #bf00ff, 0 0 20px rgba(191,0,255,0.4)',
    description: 'Rules mutate every prompt. Answer under shifting conditions. Adaptability is your only weapon.',
    icon: '🎲', accent: 'var(--neon-purple)',
    border: 'rgba(191,0,255,0.2)', borderHover: 'rgba(191,0,255,0.55)',
    glow: 'rgba(191,0,255,0.06)', glowHover: 'rgba(191,0,255,0.12)',
    barColor: 'linear-gradient(90deg, #bf00ff, #8800cc)', barGlow: 'rgba(191,0,255,0.6)',
    stat: '3 mutations', statLabel: 'Rule shifts',
  },
];

// ── Optimized Particle Canvas ────────────────────────────────
// Reduced from 55 → 28 particles, uses devicePixelRatio for crisp render
function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let active = true;

    const resize = () => {
      // Use actual CSS size, not window size, to avoid overdraw
      const rect = canvas.getBoundingClientRect();
      canvas.width  = rect.width;
      canvas.height = rect.height;
    };
    resize();

    // Listen only once, debounced
    let resizeTimer;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 200);
    };
    window.addEventListener('resize', onResize);

    const COLORS = ['#00ff88', '#00d4ff', '#bf00ff'];
    // 28 particles instead of 55 — cuts draw calls in half
    const N = 28;

    const particles = Array.from({ length: N }, () => ({
      x:  Math.random() * canvas.width,
      y:  Math.random() * canvas.height,
      r:  Math.random() * 1.2 + 0.4,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: Math.random() * 0.4 + 0.12,
    }));

    // Pre-build color strings to avoid repeated string operations per frame
    const colorMap = {
      '#00ff88': 'rgba(0,255,136,',
      '#00d4ff': 'rgba(0,212,255,',
      '#bf00ff': 'rgba(191,0,255,',
    };

    let frameCount = 0;

    const draw = () => {
      if (!active) return;
      frameCount++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Connection lines: only check every other frame to save CPU
      if (frameCount % 2 === 0) {
        for (let i = 0; i < N; i++) {
          for (let j = i + 1; j < N; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist2 = dx * dx + dy * dy;
            if (dist2 < 10000) { // 100px² threshold
              ctx.beginPath();
              ctx.strokeStyle = `rgba(0,212,255,${0.05 * (1 - Math.sqrt(dist2) / 100)})`;
              ctx.lineWidth = 0.5;
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
            }
          }
        }
      }

      // Dots — skip shadowBlur on mobile (expensive)
      const isMobile = canvas.width < 600;
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `${colorMap[p.color]}${p.alpha})`;
        if (!isMobile) {
          ctx.shadowBlur = 5;
          ctx.shadowColor = p.color;
        }
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });

      if (!isMobile) ctx.shadowBlur = 0;
      raf = requestAnimationFrame(draw);
    };

    // Small delay before starting — lets the rest of the page paint first
    const startDelay = setTimeout(() => { draw(); }, 300);

    return () => {
      active = false;
      cancelAnimationFrame(raf);
      clearTimeout(startDelay);
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 0,
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
        borderRadius: 14, padding: '1.5rem', cursor: 'default',
        transition: 'all 0.3s ease',
        transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered
          ? `0 12px 40px rgba(0,0,0,0.5), 0 0 24px ${round.glow.replace('0.06','0.2').replace('0.08','0.25')}`
          : '0 4px 16px rgba(0,0,0,0.3)',
        // Use opacity animation instead of transform for smoother mobile perf
        animation: `fadeIn 0.4s ease both`,
        animationDelay: `${0.3 + index * 0.1}s`,
        opacity: 0,
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, transparent, ${round.accent}, transparent)`,
        opacity: hovered ? 1 : 0, transition: 'opacity 0.3s',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          {round.label}
        </span>
        <span style={{
          fontFamily: 'var(--font-heading)', fontSize: '0.6rem', fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: round.difficultyColor, textShadow: round.difficultyGlow,
          padding: '0.2rem 0.6rem', border: `1px solid ${round.border}`,
          borderRadius: 100, background: `${round.glow}`,
        }}>
          {round.difficulty}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.65rem' }}>
        <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{round.icon}</span>
        <h3 style={{
          fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 800,
          letterSpacing: '0.08em',
          color: hovered ? round.accent : 'var(--text-bright)',
          textShadow: hovered ? round.difficultyGlow : 'none',
          transition: 'color 0.3s, text-shadow 0.3s', margin: 0,
        }}>
          {round.title}
        </h3>
      </div>

      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.87rem', lineHeight: 1.55, color: 'var(--text-secondary)', margin: '0 0 1rem 0' }}>
        {round.description}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: round.accent, boxShadow: `0 0 6px ${round.accent}`, flexShrink: 0 }} />
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.65rem', fontWeight: 700, color: round.accent, textShadow: round.difficultyGlow, letterSpacing: '0.1em' }}>
          {round.stat}
        </span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          — {round.statLabel}
        </span>
      </div>

      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
        background: round.barColor, boxShadow: `0 0 8px ${round.barGlow}`,
        transform: `scaleX(${hovered ? 1 : 0})`, transformOrigin: 'left',
        transition: 'transform 0.35s ease', borderRadius: '0 0 14px 14px',
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

  // Delay mount animations slightly so page renders fast first
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const trimmed = playerName.trim();
  const canStart = trimmed.length > 0;

  const handleStart = () => { if (canStart) onStart(trimmed); };
  const handleKeyDown = (e) => { if (e.key === 'Enter' && canStart) handleStart(); };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'flex-start',
      padding: '2rem 1.5rem 4rem',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Ambient blobs — CSS only, no JS cost */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: '-10%', left: '-5%',
          width: '50vw', height: '50vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,255,136,0.04) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-15%', right: '-10%',
          width: '60vw', height: '60vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(191,0,255,0.05) 0%, transparent 65%)',
        }} />
      </div>

      {/* Particles — delayed start, reduced count */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <ParticleCanvas />
      </div>

      <div style={{
        position: 'relative', zIndex: 1, width: '100%', maxWidth: 860,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>

        {/* Header */}
        <header style={{
          textAlign: 'center', marginBottom: '2.5rem',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'none' : 'translateY(16px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
            marginBottom: '1.2rem', padding: '0.3rem 1rem',
            border: '1px solid rgba(0,212,255,0.2)', borderRadius: 100,
            background: 'rgba(0,212,255,0.06)',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--neon-green)', boxShadow: 'var(--glow-green)',
              display: 'inline-block', animation: 'roundPing 1.8s ease-in-out infinite',
            }} />
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Human Intelligence Challenge
            </span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-heading)', fontWeight: 900,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            fontSize: 'clamp(2.2rem, 7vw, 4.5rem)', lineHeight: 1.05, marginBottom: '0.4rem',
          }}>
            <span style={{
              display: 'block',
              background: 'linear-gradient(135deg, var(--neon-green) 0%, var(--neon-blue) 55%, var(--neon-purple) 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 16px rgba(0,212,255,0.5))',
            }}>
              NeuroClash
            </span>
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            <div style={{ height: 1, width: 50, background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.4))' }} />
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(0.75rem,2vw,1rem)', fontWeight: 600, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              AI <span style={{ color: 'var(--neon-purple)', textShadow: 'var(--glow-purple)' }}>vs</span> Human
            </span>
            <div style={{ height: 1, width: 50, background: 'linear-gradient(90deg, rgba(0,212,255,0.4), transparent)' }} />
          </div>

          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '1rem', letterSpacing: '0.03em' }}>
            Three rounds. Three disciplines. One winner.
          </p>
        </header>

        {/* Round Cards */}
        <section style={{ width: '100%', marginBottom: '2.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {ROUNDS.map((round, i) => (
              <RoundCard key={round.id} round={round} index={i} />
            ))}
          </div>
        </section>

        {/* Player Entry */}
        <div style={{
          width: '100%', maxWidth: 480,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'none' : 'translateY(12px)',
          transition: 'opacity 0.5s ease 0.25s, transform 0.5s ease 0.25s',
        }}>
          <div style={{ width: '100%' }}>
            <label style={{
              display: 'block', fontFamily: 'var(--font-heading)', fontSize: '0.68rem',
              fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
              color: inputFocused ? 'var(--neon-blue)' : 'var(--text-muted)',
              marginBottom: '0.5rem', transition: 'color 0.2s',
            }}>
              Enter your callsign
            </label>

            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                borderRadius: '4px 0 0 4px',
                background: inputFocused ? 'linear-gradient(180deg, var(--neon-green), var(--neon-blue))' : 'var(--border-subtle)',
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
                  width: 'calc(100% - 3px)', fontFamily: 'var(--font-body)',
                  fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)',
                  background: inputFocused ? 'rgba(12,12,30,0.98)' : 'var(--bg-input)',
                  border: `1px solid ${inputFocused ? 'var(--neon-blue)' : 'var(--border-subtle)'}`,
                  borderRadius: '0 8px 8px 0', padding: '0.85rem 3rem 0.85rem 1.2rem',
                  outline: 'none', transition: 'all 0.2s ease',
                  caretColor: 'var(--neon-green)',
                  boxShadow: inputFocused ? '0 0 0 2px rgba(0,212,255,0.12), 0 0 20px rgba(0,212,255,0.12)' : 'none',
                  letterSpacing: '0.03em', marginLeft: 3,
                }}
              />
              {playerName.length > 0 && (
                <span style={{
                  position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)',
                  fontFamily: 'var(--font-heading)', fontSize: '0.6rem', fontWeight: 700,
                  color: playerName.length >= 18 ? 'var(--neon-yellow)' : 'var(--text-muted)',
                  letterSpacing: '0.05em', transition: 'color 0.2s',
                }}>
                  {playerName.length}/20
                </span>
              )}
            </div>

            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem', paddingLeft: 4 }}>
              {canStart ? `Ready to battle, ${trimmed}? Hit Start Game ↓` : 'Your name will appear on the leaderboard.'}
            </p>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
            <button
              onClick={handleStart}
              disabled={!canStart}
              onMouseEnter={() => setBtnHovered(true)}
              onMouseLeave={() => setBtnHovered(false)}
              style={{
                width: '100%', fontFamily: 'var(--font-heading)', fontSize: '0.95rem',
                fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase',
                color: canStart ? 'var(--neon-green)' : 'var(--text-muted)',
                background: canStart
                  ? btnHovered ? 'linear-gradient(135deg, rgba(0,255,136,0.22), rgba(0,255,136,0.08))' : 'linear-gradient(135deg, rgba(0,255,136,0.14), rgba(0,255,136,0.04))'
                  : 'rgba(255,255,255,0.03)',
                border: `1px solid ${canStart ? 'var(--neon-green)' : 'var(--border-subtle)'}`,
                borderRadius: 10, padding: '1rem 2rem',
                cursor: canStart ? 'pointer' : 'not-allowed',
                transition: 'all 0.25s ease',
                transform: canStart && btnHovered ? 'translateY(-2px)' : 'none',
                boxShadow: canStart ? btnHovered ? 'var(--glow-green), inset 0 0 24px rgba(0,255,136,0.08)' : '0 0 14px rgba(0,255,136,0.2)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                opacity: canStart ? 1 : 0.45, position: 'relative', overflow: 'hidden',
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>▶</span>
              Start Game
            </button>

            <button
              onClick={onLeaderboard}
              onMouseEnter={() => setLbHovered(true)}
              onMouseLeave={() => setLbHovered(false)}
              style={{
                width: '100%', fontFamily: 'var(--font-heading)', fontSize: '0.82rem',
                fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase',
                color: lbHovered ? 'var(--neon-blue)' : 'var(--text-secondary)',
                background: lbHovered ? 'rgba(0,212,255,0.07)' : 'transparent',
                border: `1px solid ${lbHovered ? 'rgba(0,212,255,0.4)' : 'var(--border-subtle)'}`,
                borderRadius: 10, padding: '0.8rem 2rem', cursor: 'pointer',
                transition: 'all 0.25s ease',
                transform: lbHovered ? 'translateY(-1px)' : 'none',
                boxShadow: lbHovered ? '0 0 14px rgba(0,212,255,0.12)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.55rem',
              }}
            >
              <span>🏆</span> View Leaderboard
            </button>
          </div>
        </div>

        <p style={{
          fontFamily: 'var(--font-body)', fontSize: '0.72rem', color: 'var(--text-muted)',
          textAlign: 'center', marginTop: '2.5rem', letterSpacing: '0.04em',
          opacity: mounted ? 0.6 : 0, transition: 'opacity 0.5s ease 0.4s',
        }}>
          Best of 3 rounds &nbsp;·&nbsp; No ties allowed &nbsp;·&nbsp; May the better mind win
        </p>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes roundPing {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.85); }
        }
        @keyframes shimmerSweep {
          from { transform: translateX(-100%); }
          to   { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}