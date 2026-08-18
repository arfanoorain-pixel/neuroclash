import React, { useState, useEffect } from 'react';
import StartScreen from './components/StartScreen';
import AIPersonalityScreen from './components/AIPersonalityScreen';
import GameScreen from './components/GameScreen';
import ResultScreen from './components/ResultScreen';
import Leaderboard, { addScore } from './components/Leaderboard';
import soundEffects from './utils/soundEffects';

function App() {
  const [screen,        setScreen]        = useState('start');
  const [playerName,    setPlayerName]    = useState('');
  const [aiPersonality, setAiPersonality] = useState(null);
  const [humanScore,    setHumanScore]    = useState(0);
  const [aiScore,       setAiScore]       = useState(0);
  const [roundResults,  setRoundResults]  = useState([]);

  // Start music on first user interaction (browser autoplay policy)
  useEffect(() => {
    const startMusic = () => {
      soundEffects.startBackgroundMusic();
      window.removeEventListener('click',      startMusic);
      window.removeEventListener('keydown',    startMusic);
      window.removeEventListener('touchstart', startMusic);
    };
    window.addEventListener('click',      startMusic);
    window.addEventListener('keydown',    startMusic);
    window.addEventListener('touchstart', startMusic);
    return () => {
      window.removeEventListener('click',      startMusic);
      window.removeEventListener('keydown',    startMusic);
      window.removeEventListener('touchstart', startMusic);
    };
  }, []);

  const handleStart = (name) => {
    setPlayerName(name);
    setScreen('personality');
  };

  const handlePersonalitySelect = (personality) => {
    setAiPersonality(personality);
    setHumanScore(0);
    setAiScore(0);
    setRoundResults([]);
    setScreen('game');
  };

  const handleGameEnd = async (hScore, aScore, results) => {
    setHumanScore(hScore);
    setAiScore(aScore);
    setRoundResults(results); 
    setScreen('result');
    await addScore(playerName, hScore, aiPersonality?.name);
  };

  // "Play Again" — same name, same AI, restart game
  const handlePlayAgain = () => {
    setHumanScore(0);
    setAiScore(0);
    setRoundResults([]);
    setScreen('game');
  };

  // "Change AI" — keep name, go back to personality picker
  const handlePickAI = () => {
    setHumanScore(0);
    setAiScore(0);
    setRoundResults([]);
    setAiPersonality(null);
    setScreen('personality');
  };

  // "Main Menu" — go all the way back to start screen
  const handleMainMenu = () => {
    setHumanScore(0);
    setAiScore(0);
    setRoundResults([]);
    setAiPersonality(null);
    setScreen('start');
  };

  return (
    <div className="app">
      {screen === 'start' && (
        <StartScreen
          onStart={handleStart}
          onLeaderboard={() => setScreen('leaderboard')}
        />
      )}

      {screen === 'personality' && (
        <AIPersonalityScreen
          playerName={playerName}
          onSelect={handlePersonalitySelect}
        />
      )}

      {screen === 'game' && (
        <GameScreen
          playerName={playerName}
          aiPersonality={aiPersonality}
          onGameEnd={handleGameEnd}
        />
      )}

      {screen === 'result' && (
        <ResultScreen
          playerName={playerName}
          humanScore={humanScore}
          aiScore={aiScore}
          roundResults={roundResults}
          aiPersonality={aiPersonality}
          onPlayAgain={handlePlayAgain}
          onPickAI={handlePickAI}
          onMainMenu={handleMainMenu}
          onLeaderboard={() => setScreen('leaderboard')}
        />
      )}

      {screen === 'leaderboard' && (
        <Leaderboard
          playerName={playerName}
          onBack={() => setScreen('start')}
        />
      )}
    </div>
  );
}

export default App;