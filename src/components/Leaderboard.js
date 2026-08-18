import React, { useState, useEffect } from 'react';

// ─────────────────────────────────────────────────────────────────────
// SETUP INSTRUCTIONS (one-time, 2 minutes):
//
// 1. Go to https://jsonbin.io and create a FREE account
// 2. Click "Create Bin" — paste this JSON: {"scores":[]}  → Save
// 3. Copy the BIN ID from the URL (looks like: 64f3a1b2ad19ca34f87d1234)
// 4. Go to API Keys section → copy your Master Key
// 5. Replace the two values below:
// ─────────────────────────────────────────────────────────────────────
const JSONBIN_BIN_ID  = '69d7d40436566621a8960445';       // ← paste bin ID
const JSONBIN_API_KEY = '$2a$10$EQz4eDf7mYc2//6JMoUt8uRNrsuE13bDrOtScj6tYLOztE9HeYDHS';       // ← paste API key
// ─────────────────────────────────────────────────────────────────────

const BASE_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;
const HEADERS  = {
  'Content-Type':  'application/json',
  'X-Master-Key':  JSONBIN_API_KEY,
  'X-Bin-Versioning': 'false',
};

async function fetchScores() {
  const res = await fetch(BASE_URL + '/latest', { headers: HEADERS });
  const data = await res.json();
  return data.record?.scores || [];
}

async function saveScores(scores) {
  await fetch(BASE_URL, {
    method:  'PUT',
    headers: HEADERS,
    body:    JSON.stringify({ scores }),
  });
}

export async function addScore(name, score, personality) {
  try {
    const existing = await fetchScores();
    const entry    = { name, score, personality: personality || 'Normal AI', date: new Date().toLocaleDateString('en-IN') };
    const updated  = [...existing, entry].sort((a, b) => b.score - a.score).slice(0, 20);
    await saveScores(updated);
    return updated;
  } catch (e) {
    console.error('Leaderboard save failed:', e);
    // Fallback to localStorage
    const local = JSON.parse(localStorage.getItem('neuroclash_scores') || '[]');
    const entry = { name, score, personality: personality || 'Normal AI', date: new Date().toLocaleDateString('en-IN') };
    const updated = [...local, entry].sort((a, b) => b.score - a.score).slice(0, 20);
    localStorage.setItem('neuroclash_scores', JSON.stringify(updated));
    return updated;
  }
}

// ── Component ───────────────────────────────────────────────────────
export default function Leaderboard({ playerName, onBack }) {
  const [scores,  setScores]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    loadScores();
  }, []);

  const loadScores = async () => {
    setLoading(true);
    setError(false);
    try {
      // Try cloud first
      if (JSONBIN_BIN_ID !== 'YOUR_BIN_ID_HERE') {
        const cloudScores = await fetchScores();
        setScores(cloudScores);
      } else {
        // Fallback to localStorage if not configured
        const local = JSON.parse(localStorage.getItem('neuroclash_scores') || '[]');
        setScores(local);
      }
    } catch (e) {
      // Cloud failed — show localStorage
      const local = JSON.parse(localStorage.getItem('neuroclash_scores') || '[]');
      setScores(local);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const medalColor = (i) => {
    if (i === 0) return '#ffe600';
    if (i === 1) return '#aaaaaa';
    if (i === 2) return '#cd7f32';
    return 'rgba(255,255,255,0.25)';
  };

  const personalityColor = (p) => {
    if (!p) return 'rgba(255,255,255,0.3)';
    if (p.includes('Sleepy'))  return '#a8d8a8';
    if (p.includes('Tryhard')) return '#ff4466';
    return '#00d4ff';
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: '2rem 1.5rem', gap: '1.5rem',
    }}>
      {/* Header */}
      <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
        Hall of Fame
      </div>
      <h1 style={{ fontSize: 'clamp(2rem,6vw,3.5rem)', fontWeight: 900, color: '#ffe600', textShadow: '0 0 20px #ffe600, 0 0 60px rgba(255,230,0,0.3)', margin: 0 }}>
        Leaderboard
      </h1>

      {/* Cloud / local badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.3rem 0.9rem', borderRadius: 100,
        border: `1px solid ${error ? 'rgba(255,170,0,0.3)' : 'rgba(0,255,136,0.25)'}`,
        background: error ? 'rgba(255,170,0,0.05)' : 'rgba(0,255,136,0.05)',
      }}>
        <span style={{ fontSize: 8, color: error ? '#ffaa00' : '#00ff88' }}>●</span>
        <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: error ? '#ffaa00' : '#00ff88' }}>
          {JSONBIN_BIN_ID === 'YOUR_BIN_ID_HERE' ? 'Local only — configure JSONBin for global scores' : error ? 'Cloud offline — showing local scores' : 'Global scores — all players visible'}
        </span>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: '2rem' }}>
          <div style={{ width: 36, height: 36, border: '3px solid rgba(255,230,0,0.2)', borderTop: '3px solid #ffe600', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>Loading scores...</p>
        </div>
      )}

      {/* Scores */}
      {!loading && scores.length === 0 && (
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '1rem', marginTop: '2rem' }}>
          No scores yet. Play your first game!
        </p>
      )}

      {!loading && scores.length > 0 && (
        <div style={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {scores.map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.85rem 1.25rem', borderRadius: 10,
              background: s.name === playerName ? 'rgba(0,255,136,0.07)' : 'rgba(255,255,255,0.025)',
              border: `1px solid ${s.name === playerName ? 'rgba(0,255,136,0.28)' : 'rgba(255,255,255,0.05)'}`,
              transition: 'all 0.2s',
              animation: `fadeInUp 0.3s ease ${i * 0.05}s both`,
            }}>
              {/* Rank */}
              <div style={{ fontSize: i < 3 ? '1.2rem' : '0.95rem', fontWeight: 900, color: medalColor(i), minWidth: 30, textAlign: 'center' }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
              </div>

              {/* Name */}
              <div style={{ flex: 1, fontSize: '0.95rem', fontWeight: 700, color: s.name === playerName ? '#00ff88' : '#fff' }}>
                {s.name} {s.name === playerName ? <span style={{ fontSize: '0.65rem', color: '#00ff88', opacity: 0.7 }}>(you)</span> : ''}
              </div>

              {/* Personality badge */}
              {s.personality && (
                <div style={{
                  fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: personalityColor(s.personality),
                  border: `1px solid ${personalityColor(s.personality)}40`,
                  borderRadius: 100, padding: '0.15rem 0.5rem',
                  background: `${personalityColor(s.personality)}10`,
                }}>
                  {s.personality.replace(' AI', '')}
                </div>
              )}

              {/* Score */}
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: s.score === 3 ? '#ffe600' : s.score === 2 ? '#00ff88' : s.score === 1 ? '#00d4ff' : '#ff4444' }}>
                {s.score}/3
              </div>

              {/* Date */}
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', minWidth: 70, textAlign: 'right' }}>{s.date}</div>
            </div>
          ))}
        </div>
      )}

      {/* Refresh + Back */}
      <div style={{ display: 'flex', gap: 12, marginTop: '0.5rem' }}>
        <button onClick={loadScores} style={{
          padding: '0.65rem 1.5rem', borderRadius: 10,
          border: '1px solid rgba(255,230,0,0.2)', background: 'transparent',
          color: '#ffe600', fontSize: '0.8rem', fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer',
        }}>
          ↻ Refresh
        </button>
        <button onClick={onBack} style={{
          padding: '0.65rem 1.5rem', borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.12)', background: 'transparent',
          color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer',
        }}>
          ← Back
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}