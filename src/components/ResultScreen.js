import React, { useState } from 'react';
import { getWinTaunt, getLoseTaunt } from '../utils/aiTaunts';
import soundEffects from '../utils/soundEffects';

export default function ResultScreen({ playerName, humanScore, aiScore, roundResults, aiPersonality, onPlayAgain, onLeaderboard, onPickAI, onMainMenu }) {
  const playerWon = humanScore > aiScore;
  const isTie     = humanScore === aiScore;
  const taunt     = playerWon ? getLoseTaunt() : getWinTaunt();

  const resultColor = isTie ? '#ffe600' : playerWon ? '#00ff88' : '#ff4444';
  const resultText  = isTie ? 'DRAW!' : playerWon ? 'YOU WIN!' : 'AI WINS!';
  const subText     = isTie ? 'Even match. Play again to break the tie!'
    : playerWon ? 'You outsmarted the machine!'
    : 'The AI reigns supreme... for now.';

  const [hoveredBtn, setHoveredBtn] = useState(null);

  React.useEffect(() => {
    if (playerWon) soundEffects.playWinSound();
    else soundEffects.playCustomLoseSound();
  }, []);

  const btn = (label, onClick, color, key) => (
    <button
      key={key}
      onClick={onClick}
      onMouseEnter={() => setHoveredBtn(key)}
      onMouseLeave={() => setHoveredBtn(null)}
      style={{
        padding: '0.75rem 1.6rem',
        borderRadius: 10,
        border: `1px solid ${hoveredBtn === key ? color : color + '55'}`,
        background: hoveredBtn === key ? color + '15' : 'transparent',
        color: hoveredBtn === key ? color : color + 'aa',
        fontSize: '0.8rem',
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        transform: hoveredBtn === key ? 'translateY(-2px)' : 'none',
        boxShadow: hoveredBtn === key ? `0 0 16px ${color}44` : 'none',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '2rem', textAlign: 'center', gap: '1.5rem',
    }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
        Battle Complete
      </div>

      <div style={{
        fontSize: 'clamp(3rem,12vw,7rem)', fontWeight: 900,
        letterSpacing: '0.1em', color: resultColor,
        textShadow: `0 0 20px ${resultColor}, 0 0 80px ${resultColor}50`,
        lineHeight: 1,
      }}>
        {resultText}
      </div>

      <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.5)' }}>{subText}</p>

      {/* Scores */}
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#00ff88', marginBottom: 4 }}>{playerName}</div>
          <div style={{ fontSize: '3rem', fontWeight: 900, color: '#00ff88', textShadow: '0 0 20px #00ff88' }}>{humanScore}</div>
        </div>
        <div style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>vs</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: aiPersonality?.color || '#00d4ff', marginBottom: 4 }}>
            {aiPersonality ? `${aiPersonality.emoji} ${aiPersonality.name}` : 'AI'}
          </div>
          <div style={{ fontSize: '3rem', fontWeight: 900, color: aiPersonality?.color || '#00d4ff', textShadow: `0 0 20px ${aiPersonality?.color || '#00d4ff'}` }}>{aiScore}</div>
        </div>
      </div>

      {/* Round result dots */}
      <div style={{ display: 'flex', gap: '8px', margin: '0.5rem 0' }}>
        {roundResults.map((r, i) => (
          <div key={i} style={{
            width: 14, height: 14, borderRadius: '50%',
            background: r === 'human' ? '#00ff88' : r === 'ai' ? '#ff4444' : '#ffe600',
            boxShadow: r === 'human' ? '0 0 8px #00ff88' : r === 'ai' ? '0 0 8px #ff4444' : '0 0 8px #ffe600',
          }} />
        ))}
      </div>

      {/* AI Taunt */}
      <div style={{
        maxWidth: 480, width: '100%',
        background: 'rgba(0,212,255,0.04)',
        border: '1px solid rgba(0,212,255,0.15)',
        borderRadius: 12, padding: '1.1rem 1.5rem', position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: -10, left: 16,
          background: '#0a0a0a', padding: '0 0.5rem',
          fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.18em',
          textTransform: 'uppercase', color: '#00d4ff',
        }}>
          AI says
        </div>
        <p style={{ fontSize: '0.95rem', fontStyle: 'italic', color: '#fff', margin: 0, lineHeight: 1.5 }}>
          "{taunt}"
        </p>
      </div>

      {/* Buttons — Row 1: Play Again + Change AI */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        {btn('🤖 Change AI',      onPickAI,      '#ff9900', 'ai')}
      </div>

      {/* Buttons — Row 2: Main Menu + Leaderboard */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        {btn('⌂ Main Menu',       onMainMenu,    '#00d4ff', 'menu')}
        {btn('🏆 Leaderboard',    onLeaderboard, '#ffe600', 'lb')}
      </div>
    </div>
  );
}