import { useState, useEffect, useRef } from 'react';

// ── Helpers ──────────────────────────────────────────────────
function readLeaderboard() {
  try {
    const raw = localStorage.getItem('neuroclash_leaderboard');
    if (!raw) return [];
    const entries = JSON.parse(raw);
    if (!Array.isArray(entries)) return [];

    // Deduplicate by playerName keeping best score, then sort desc
    const best = {};
    entries.forEach(e => {
      const key = (e.playerName || 'Unknown').toLowerCase();
      if (!best[key] || e.humanScore > best[key].humanScore) {
        best[key] = e;
      }
    });

    return Object.values(best)
      .sort((a, b) => b.humanScore - a.humanScore || new Date(b.date) - new Date(a.date))
      .slice(0, 10);
  } catch {
    return [];
  }
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffH   = Math.floor(diffMs / 3600000);
    const diffD   = Math.floor(diffMs / 86400000);
    if (diffMin < 1)  return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffH   < 24) return `${diffH}h ago`;
    if (diffD   < 7)  return `${diffD}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

function getRoundBreakdown(roundResults = []) {
  const labels = { human: 'W', ai: 'L', draw: 'D' };
  const colors = { human: '#00ff88', ai: '#ff003c', draw: '#ffe600' };
  return roundResults.slice(0, 3).map(r => ({
    label: labels[r] ?? '?',
    color: colors[r] ?? '#666',
  }));
}

// ── Rank badge ───────────────────────────────────────────────
function RankBadge({ rank }) {
  const configs = {
    1: { label: '1',  bg: 'linear-gradient(135deg,#ffe600,#ffaa00)', color: '#0a0a0a', glow: '0 0 12px rgba(255,230,0,0.8), 0 0 24px rgba(255,230,0,0.4)', icon: '👑' },
    2: { label: '2',  bg: 'linear-gradient(135deg,#c0c0c0,#888888)', color: '#0a0a0a', glow: '0 0 10px rgba(192,192,192,0.6)', icon: null },
    3: { label: '3',  bg: 'linear-gradient(135deg,#cd7f32,#8b4513)', color: '#fff',    glow: '0 0 10px rgba(205,127,50,0.6)',  icon: null },
  };
  const cfg = configs[rank];

  if (cfg) {
    return (
      <div style={{
        position: 'relative',
        width: 38, height: 38,
        borderRadius: '50%',
        background: cfg.bg,
        boxShadow: cfg.glow,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        {cfg.icon && (
          <span style={{
            position: 'absolute',
            top: -10, left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '0.75rem',
          }}>{cfg.icon}</span>
        )}
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '0.85rem',
          fontWeight: 900,
          color: cfg.color,
          lineHeight: 1,
        }}>{cfg.label}</span>
      </div>
    );
  }

  return (
    <div style={{
      width: 38, height: 38,
      borderRadius: '50%',
      border: '1px solid rgba(255,255,255,0.08)',
      background: 'rgba(255,255,255,0.03)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      <span style={{
        fontFamily: 'var(--font-heading)',
        fontSize: '0.78rem',
        fontWeight: 700,
        color: 'var(--text-muted)',
        lineHeight: 1,
      }}>{rank}</span>
    </div>
  );
}

// ── Score bar visual ─────────────────────────────────────────
function ScoreBar({ score, maxScore }) {
  const [width, setWidth] = useState(0);
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 80);
    return () => clearTimeout(t);
  }, [pct]);

  const color = score === 3 ? '#00ff88' : score === 2 ? '#00d4ff' : score === 1 ? '#bf00ff' : '#ff003c';
  const glow  = score === 3 ? 'rgba(0,255,136,0.6)'
              : score === 2 ? 'rgba(0,212,255,0.6)'
              : score === 1 ? 'rgba(191,0,255,0.6)'
              : 'rgba(255,0,60,0.6)';

  return (
    <div style={{
      flex: 1,
      height: 4,
      background: 'rgba(255,255,255,0.05)',
      borderRadius: 100,
      overflow: 'hidden',
      minWidth: 60,
    }}>
      <div style={{
        height: '100%',
        width: `${width}%`,
        borderRadius: 100,
        background: color,
        boxShadow: `0 0 6px ${glow}`,
        transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
      }} />
    </div>
  );
}

// ── Leaderboard row ──────────────────────────────────────────
function LeaderRow({ entry, rank, isCurrentPlayer, maxScore, index }) {
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100 + index * 80);
    return () => clearTimeout(t);
  }, [index]);

  const breakdown = getRoundBreakdown(entry.roundResults);
  const isMedal   = rank <= 3;

  const rowBg = isCurrentPlayer
    ? 'linear-gradient(135deg, rgba(0,255,136,0.08), rgba(0,212,255,0.05))'
    : hovered
      ? 'rgba(255,255,255,0.03)'
      : rank === 1
        ? 'rgba(255,230,0,0.03)'
        : 'transparent';

  const rowBorder = isCurrentPlayer
    ? '1px solid rgba(0,255,136,0.3)'
    : hovered
      ? '1px solid rgba(255,255,255,0.08)'
      : '1px solid transparent';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '46px 1fr auto',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.85rem 1.1rem',
        background: rowBg,
        border: rowBorder,
        borderRadius: 10,
        transition: 'all 0.25s ease',
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(12px)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Current player highlight strip */}
      {isCurrentPlayer && (
        <div style={{
          position: 'absolute',
          left: 0, top: 0, bottom: 0,
          width: 3,
          background: 'linear-gradient(180deg, var(--neon-green), var(--neon-blue))',
          boxShadow: 'var(--glow-green)',
          borderRadius: '4px 0 0 4px',
        }} />
      )}

      {/* Rank */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <RankBadge rank={rank} />
      </div>

      {/* Player info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '0.88rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            color: isCurrentPlayer ? 'var(--neon-green)' : 'var(--text-bright)',
            textShadow: isCurrentPlayer ? 'var(--glow-green)' : 'none',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            maxWidth: 160,
          }}>
            {entry.playerName || 'Unknown'}
          </span>
          {isCurrentPlayer && (
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '0.52rem',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--neon-green)',
              padding: '0.15rem 0.45rem',
              border: '1px solid rgba(0,255,136,0.35)',
              borderRadius: 100,
              background: 'rgba(0,255,136,0.08)',
              flexShrink: 0,
            }}>
              You
            </span>
          )}
          {entry.didWin && (
            <span style={{ fontSize: '0.75rem', flexShrink: 0 }} title="Won this game">⚡</span>
          )}
        </div>

        {/* Score bar + round badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <ScoreBar score={entry.humanScore} maxScore={maxScore} />
          {breakdown.length > 0 && (
            <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
              {breakdown.map((b, i) => (
                <span key={i} style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '0.55rem',
                  fontWeight: 800,
                  color: b.color,
                  textShadow: `0 0 6px ${b.color}`,
                  width: 16, height: 16,
                  borderRadius: '50%',
                  border: `1px solid ${b.color}50`,
                  background: `${b.color}12`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {b.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Score + date */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem', flexShrink: 0 }}>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '1.3rem',
          fontWeight: 900,
          lineHeight: 1,
          color: entry.humanScore === 3 ? 'var(--neon-green)'
               : entry.humanScore === 2 ? 'var(--neon-blue)'
               : entry.humanScore === 1 ? 'var(--neon-purple)'
               : 'var(--text-muted)',
          textShadow: entry.humanScore === 3 ? 'var(--glow-green)'
                    : entry.humanScore === 2 ? 'var(--glow-blue)'
                    : entry.humanScore === 1 ? 'var(--glow-purple)'
                    : 'none',
        }}>
          {entry.humanScore}
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '0.6rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            marginLeft: 3,
            textShadow: 'none',
          }}>
            / 3
          </span>
        </span>
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.68rem',
          color: 'var(--text-muted)',
          whiteSpace: 'nowrap',
        }}>
          {formatDate(entry.date)}
        </span>
      </div>
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 2rem',
      gap: '1.25rem',
      animation: 'fadeIn 0.5s ease',
    }}>
      {/* Animated icon ring */}
      <div style={{ position: 'relative', width: 80, height: 80 }}>
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: '50%',
          border: '1px solid rgba(0,212,255,0.15)',
          animation: 'rotateSlow 8s linear infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 8,
          borderRadius: '50%',
          border: '1px dashed rgba(0,255,136,0.1)',
          animation: 'rotateSlow 5s linear infinite reverse',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem',
        }}>
          🏆
        </div>
      </div>

      <div style={{
        fontFamily: 'var(--font-heading)',
        fontSize: '0.7rem',
        fontWeight: 700,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        textAlign: 'center',
      }}>
        No battles recorded yet
      </div>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: '0.9rem',
        color: 'var(--text-muted)',
        textAlign: 'center',
        maxWidth: 280,
        lineHeight: 1.6,
        margin: 0,
      }}>
        Complete your first game to claim the top spot. The AI is waiting.
      </p>
    </div>
  );
}

// ── Stats summary bar ────────────────────────────────────────
function StatsSummary({ entries, playerName }) {
  const totalGames = entries.length;
  const humanWins  = entries.filter(e => e.didWin).length;
  const perfect    = entries.filter(e => e.humanScore === 3).length;
  const currentRank = entries.findIndex(
    e => e.playerName?.toLowerCase() === playerName?.toLowerCase()
  ) + 1;

  const stats = [
    { label: 'Players',     value: totalGames,                    color: 'var(--neon-blue)'   },
    { label: 'Human Wins',  value: humanWins,                     color: 'var(--neon-green)'  },
    { label: 'Perfect 3/3', value: perfect,                       color: 'var(--neon-purple)' },
    { label: 'Your Rank',   value: currentRank > 0 ? `#${currentRank}` : '—', color: 'var(--neon-yellow, #ffe600)' },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '0.75rem',
      marginBottom: '1.5rem',
      animation: 'slideInUp 0.5s ease 0.2s both',
    }}>
      {stats.map((s, i) => (
        <div key={i} style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.25rem',
          padding: '0.75rem 0.5rem',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: 10,
          transition: 'border-color 0.25s ease',
        }}>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(1.1rem, 3vw, 1.5rem)',
            fontWeight: 900,
            color: s.color,
            lineHeight: 1,
            textShadow: `0 0 10px ${s.color}80`,
          }}>
            {s.value}
          </span>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '0.52rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            textAlign: 'center',
          }}>
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────
export default function Leaderboard({ playerName, onBack }) {
  const [entries,     setEntries]     = useState([]);
  const [backHover,   setBackHover]   = useState(false);
  const [clearHover,  setClearHover]  = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mounted,     setMounted]     = useState(false);
  const [refreshKey,  setRefreshKey]  = useState(0);

  useEffect(() => {
    setEntries(readLeaderboard());
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, [refreshKey]);

  const handleClear = () => {
    if (!showConfirm) { setShowConfirm(true); return; }
    try { localStorage.removeItem('neuroclash_leaderboard'); } catch {}
    setShowConfirm(false);
    setRefreshKey(k => k + 1);
  };

  const maxScore   = 3; // max rounds
  const isEmpty    = entries.length === 0;
  const currentRank = entries.findIndex(
    e => e.playerName?.toLowerCase() === playerName?.toLowerCase()
  ) + 1;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '2rem 1.5rem 4rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(191,0,255,0.05) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Scanlines */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.025) 2px,rgba(0,0,0,0.025) 4px)',
        pointerEvents: 'none', zIndex: 1,
      }} />

      <div style={{
        position: 'relative', zIndex: 5,
        width: '100%', maxWidth: 640,
        display: 'flex', flexDirection: 'column',
        animation: mounted ? 'fadeIn 0.35s ease' : 'none',
      }}>

        {/* ── Header ── */}
        <header style={{ marginBottom: '2rem' }}>
          {/* Back button */}
          <button
            onClick={onBack}
            onMouseEnter={() => setBackHover(true)}
            onMouseLeave={() => setBackHover(false)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontFamily: 'var(--font-heading)',
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: backHover ? 'var(--neon-blue)' : 'var(--text-muted)',
              background: 'transparent',
              border: `1px solid ${backHover ? 'rgba(0,212,255,0.35)' : 'transparent'}`,
              borderRadius: 8,
              padding: '0.4rem 0.8rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textShadow: backHover ? 'var(--glow-blue)' : 'none',
              marginBottom: '1.5rem',
              marginLeft: -8,
            }}
          >
            ← Back
          </button>

          {/* Title row */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}>
            <div>
              <div style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '0.62rem',
                fontWeight: 700,
                letterSpacing: '0.26em',
                textTransform: 'uppercase',
                color: 'var(--neon-purple)',
                textShadow: 'var(--glow-purple)',
                marginBottom: '0.4rem',
                animation: 'slideInUp 0.4s ease 0.05s both',
              }}>
                NeuroClash
              </div>
              <h1 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(1.6rem, 5vw, 2.6rem)',
                fontWeight: 900,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                margin: 0,
                lineHeight: 1,
                background: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.6) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'slideInUp 0.4s ease 0.1s both',
              }}>
                Leaderboard
              </h1>
            </div>

            {/* Trophy icon */}
            <div style={{
              fontSize: '2.5rem',
              filter: 'drop-shadow(0 0 12px rgba(255,230,0,0.5))',
              animation: 'slideInUp 0.4s ease 0.15s both',
              flexShrink: 0,
            }}>
              🏆
            </div>
          </div>

          {/* Neon divider */}
          <div style={{
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(191,0,255,0.5), rgba(0,212,255,0.3), transparent)',
            marginTop: '1.25rem',
            animation: 'slideInUp 0.4s ease 0.2s both',
          }} />
        </header>

        {/* ── Stats summary (only if entries exist) ── */}
        {!isEmpty && (
          <StatsSummary entries={entries} playerName={playerName} />
        )}

        {/* ── Table header ── */}
        {!isEmpty && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '46px 1fr auto',
            gap: '0.75rem',
            padding: '0 1.1rem 0.5rem',
            animation: 'slideInUp 0.4s ease 0.3s both',
          }}>
            {['Rank', 'Player', 'Score'].map((h, i) => (
              <span key={i} style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '0.57rem',
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                textAlign: i === 0 ? 'center' : i === 2 ? 'right' : 'left',
              }}>{h}</span>
            ))}
          </div>
        )}

        {/* ── Rows / Empty ── */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.45rem',
        }}>
          {isEmpty
            ? <EmptyState />
            : entries.map((entry, i) => (
                <LeaderRow
                  key={entry.id ?? i}
                  entry={entry}
                  rank={i + 1}
                  isCurrentPlayer={
                    entry.playerName?.toLowerCase() === playerName?.toLowerCase()
                  }
                  maxScore={maxScore}
                  index={i}
                />
              ))
          }
        </div>

        {/* ── Current player callout (if not in top 10 shown) ── */}
        {!isEmpty && playerName && currentRank === 0 && (
          <div style={{
            marginTop: '1.25rem',
            padding: '0.85rem 1.1rem',
            background: 'rgba(0,255,136,0.04)',
            border: '1px dashed rgba(0,255,136,0.2)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            animation: 'fadeIn 0.5s ease 1s both',
          }}>
            <span style={{ fontSize: '1.1rem' }}>👤</span>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
              margin: 0,
            }}>
              <span style={{ color: 'var(--neon-green)', fontWeight: 600 }}>{playerName}</span>
              {' '}— not yet ranked. Complete a game to appear on the board.
            </p>
          </div>
        )}

        {/* ── Legend ── */}
        {!isEmpty && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginTop: '1.5rem',
            padding: '0 0.5rem',
            flexWrap: 'wrap',
            animation: 'fadeIn 0.5s ease 1.2s both',
          }}>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '0.55rem',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}>
              Round results:
            </span>
            {[
              { label: 'W', color: '#00ff88', text: 'Win'  },
              { label: 'L', color: '#ff003c', text: 'Loss' },
              { label: 'D', color: '#ffe600', text: 'Draw' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '0.55rem',
                  fontWeight: 800,
                  color: item.color,
                  width: 16, height: 16,
                  borderRadius: '50%',
                  border: `1px solid ${item.color}50`,
                  background: `${item.color}12`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 4px ${item.color}60`,
                }}>
                  {item.label}
                </span>
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.68rem',
                  color: 'var(--text-muted)',
                }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── Clear scores ── */}
        {!isEmpty && (
          <div style={{
            marginTop: '2rem',
            display: 'flex',
            justifyContent: 'center',
            animation: 'fadeIn 0.5s ease 1.4s both',
          }}>
            <button
              onClick={handleClear}
              onMouseEnter={() => setClearHover(true)}
              onMouseLeave={() => { setClearHover(false); setShowConfirm(false); }}
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: showConfirm ? '#ff003c' : clearHover ? 'rgba(255,0,60,0.7)' : 'var(--text-muted)',
                background: showConfirm ? 'rgba(255,0,60,0.08)' : 'transparent',
                border: `1px solid ${showConfirm ? 'rgba(255,0,60,0.4)' : clearHover ? 'rgba(255,0,60,0.2)' : 'transparent'}`,
                borderRadius: 8,
                padding: '0.4rem 1rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textShadow: showConfirm ? '0 0 8px #ff003c' : 'none',
              }}
            >
              {showConfirm ? '⚠ Confirm — Erase all scores?' : '✕ Clear Leaderboard'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}