import { useState } from 'react';

const PERSONALITIES = [
  {
    id: 'sleepy',
    name: 'Sleepy AI',
    emoji: '😴',
    tagline: 'Half asleep. Easy prey.',
    description: 'AI is running on low power mode. Slow reactions, sluggish typing. Perfect for beginners.',
    color: '#a8d8a8',
    glow: 'rgba(168,216,168,0.4)',
    border: 'rgba(168,216,168,0.25)',
    borderHover: 'rgba(168,216,168,0.6)',
    bg: 'rgba(168,216,168,0.05)',
    bgHover: 'rgba(168,216,168,0.1)',
    stats: { reaction: 'SLOW', typing: 'SLOW', rules: 'SLOW' },
    multiplier: { reaction: 1.8, typing: 1.7, rules: 1.6 },
    badge: 'EASY MODE',
    badgeColor: '#a8d8a8',
  },
  {
    id: 'normal',
    name: 'Normal AI',
    emoji: '🤖',
    tagline: 'Fair fight. No excuses.',
    description: 'Balanced AI that plays at average human speed. A real challenge without being unfair.',
    color: '#00d4ff',
    glow: 'rgba(0,212,255,0.4)',
    border: 'rgba(0,212,255,0.25)',
    borderHover: 'rgba(0,212,255,0.6)',
    bg: 'rgba(0,212,255,0.05)',
    bgHover: 'rgba(0,212,255,0.1)',
    stats: { reaction: 'MED', typing: 'MED', rules: 'MED' },
    multiplier: { reaction: 1.0, typing: 1.0, rules: 1.0 },
    badge: 'STANDARD',
    badgeColor: '#00d4ff',
  },
  {
    id: 'tryhard',
    name: 'Tryhard AI',
    emoji: '😤',
    tagline: 'No mercy. No remorse.',
    description: 'AI is fully awake and out for blood. Lightning fast, ruthlessly efficient. Can you keep up?',
    color: '#ff4466',
    glow: 'rgba(255,68,102,0.4)',
    border: 'rgba(255,68,102,0.25)',
    borderHover: 'rgba(255,68,102,0.6)',
    bg: 'rgba(255,68,102,0.05)',
    bgHover: 'rgba(255,68,102,0.12)',
    stats: { reaction: 'FAST', typing: 'FAST', rules: 'FAST' },
    multiplier: { reaction: 0.55, typing: 0.6, rules: 0.65 },
    badge: 'HARD MODE',
    badgeColor: '#ff4466',
  },
];

const StatDot = ({ level, color }) => {
  const filled = level === 'SLOW' ? 1 : level === 'MED' ? 2 : 3;
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          width: 8, height: 8, borderRadius: '50%',
          background: i <= filled ? color : 'rgba(255,255,255,0.1)',
          boxShadow: i <= filled ? `0 0 6px ${color}` : 'none',
          transition: 'all 0.3s',
        }} />
      ))}
    </div>
  );
};

export default function AIPersonalityScreen({ playerName, onSelect }) {
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [confirmHover, setConfirmHover] = useState(false);

  const chosen = PERSONALITIES.find(p => p.id === selected);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient blobs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: '-20%', left: '-10%',
          width: '55vw', height: '55vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,68,102,0.04) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-15%', right: '-10%',
          width: '50vw', height: '50vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,212,255,0.05) 0%, transparent 65%)',
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 780, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', animation: 'slideInUp 0.5s ease both' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.3rem 0.9rem', borderRadius: 100,
            border: '1px solid rgba(255,68,102,0.25)',
            background: 'rgba(255,68,102,0.06)',
            marginBottom: '1rem',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff4466', boxShadow: '0 0 8px #ff4466', display: 'inline-block' }} />
            <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
              Choose Your Opponent
            </span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(1.8rem, 5vw, 3rem)',
            fontWeight: 900,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: '#fff',
            margin: '0 0 0.5rem 0',
          }}>
            Pick Your <span style={{ color: '#ff4466', textShadow: '0 0 20px rgba(255,68,102,0.6)' }}>AI</span>
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
            {playerName}, who do you want to face?
          </p>
        </div>

        {/* Personality Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          width: '100%',
          animation: 'slideInUp 0.5s ease 0.15s both',
        }}>
          {PERSONALITIES.map((p) => {
            const isSelected = selected === p.id;
            const isHovered = hovered === p.id;
            const active = isSelected || isHovered;

            return (
              <div
                key={p.id}
                onClick={() => setSelected(p.id)}
                onMouseEnter={() => setHovered(p.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  position: 'relative',
                  background: active ? p.bgHover : p.bg,
                  border: `1px solid ${active ? p.borderHover : p.border}`,
                  borderRadius: 16,
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  transform: active ? 'translateY(-5px)' : 'none',
                  boxShadow: isSelected
                    ? `0 0 0 2px ${p.color}, 0 16px 40px rgba(0,0,0,0.5), 0 0 30px ${p.glow}`
                    : active
                      ? `0 12px 32px rgba(0,0,0,0.4), 0 0 20px ${p.glow}`
                      : '0 4px 16px rgba(0,0,0,0.3)',
                  userSelect: 'none',
                }}
              >
                {/* Selected checkmark */}
                {isSelected && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    width: 22, height: 22, borderRadius: '50%',
                    background: p.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', color: '#000', fontWeight: 900,
                    boxShadow: `0 0 10px ${p.color}`,
                  }}>✓</div>
                )}

                {/* Top shimmer line */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                  background: `linear-gradient(90deg, transparent, ${p.color}, transparent)`,
                  opacity: active ? 1 : 0,
                  borderRadius: '16px 16px 0 0',
                  transition: 'opacity 0.3s',
                }} />

                {/* Badge */}
                <div style={{
                  display: 'inline-block',
                  fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.15em',
                  textTransform: 'uppercase', color: p.badgeColor,
                  border: `1px solid ${p.border}`,
                  borderRadius: 100, padding: '0.2rem 0.6rem',
                  marginBottom: '1rem',
                  background: p.bg,
                }}>
                  {p.badge}
                </div>

                {/* Emoji + Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '2rem' }}>{p.emoji}</span>
                  <div>
                    <div style={{
                      fontSize: '1rem', fontWeight: 800,
                      color: active ? p.color : '#fff',
                      textShadow: active ? `0 0 12px ${p.glow}` : 'none',
                      transition: 'all 0.25s',
                      fontFamily: 'var(--font-heading)',
                      letterSpacing: '0.05em',
                    }}>{p.name}</div>
                    <div style={{ fontSize: '0.72rem', color: p.color, fontStyle: 'italic', opacity: 0.8 }}>{p.tagline}</div>
                  </div>
                </div>

                {/* Description */}
                <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, margin: '0 0 1.1rem 0' }}>
                  {p.description}
                </p>

                {/* Stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {[
                    { label: 'Reaction', key: 'reaction' },
                    { label: 'Typing', key: 'typing' },
                    { label: 'Rules', key: 'rules' },
                  ].map(stat => (
                    <div key={stat.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
                        {stat.label}
                      </span>
                      <StatDot level={p.stats[stat.key]} color={p.color} />
                    </div>
                  ))}
                </div>

                {/* Bottom bar */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
                  background: `linear-gradient(90deg, transparent, ${p.color}, transparent)`,
                  transform: `scaleX(${active ? 1 : 0})`,
                  transformOrigin: 'center',
                  transition: 'transform 0.3s ease',
                  borderRadius: '0 0 16px 16px',
                }} />
              </div>
            );
          })}
        </div>

        {/* Confirm Button */}
        <div style={{ animation: 'slideInUp 0.5s ease 0.3s both', width: '100%', maxWidth: 360 }}>
          <button
            onClick={() => selected && onSelect(chosen)}
            onMouseEnter={() => setConfirmHover(true)}
            onMouseLeave={() => setConfirmHover(false)}
            disabled={!selected}
            style={{
              width: '100%',
              padding: '1rem 2rem',
              fontSize: '0.9rem', fontWeight: 700,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              fontFamily: 'var(--font-heading)',
              color: selected ? (chosen?.color || '#fff') : 'rgba(255,255,255,0.25)',
              background: selected && confirmHover
                ? `${chosen?.bgHover}`
                : selected ? chosen?.bg : 'rgba(255,255,255,0.02)',
              border: `1px solid ${selected ? (confirmHover ? chosen?.borderHover : chosen?.border) : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 12,
              cursor: selected ? 'pointer' : 'not-allowed',
              transition: 'all 0.25s ease',
              transform: selected && confirmHover ? 'translateY(-2px)' : 'none',
              boxShadow: selected && confirmHover ? `0 0 24px ${chosen?.glow}` : 'none',
              opacity: selected ? 1 : 0.4,
            }}
          >
            {selected ? `⚔️ Fight ${chosen?.name}` : 'Select an opponent first'}
          </button>

          {selected && (
            <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', marginTop: '0.75rem' }}>
              Difficulty affects AI speed across all 3 rounds
            </p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// Export personalities so aiLogic can use the multipliers
export { PERSONALITIES };