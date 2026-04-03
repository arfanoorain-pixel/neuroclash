import React, { useState } from 'react';
import StartScreen from './components/StartScreen';
import GameScreen from './components/GameScreen';
import ResultScreen from './components/ResultScreen';
import Leaderboard from './components/Leaderboard';

function App() {
  const [screen, setScreen] = useState('start');
  const [playerName, setPlayerName] = useState('');
  const [humanScore, setHumanScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [roundResults, setRoundResults] = useState([]);

  const handleStart = (name) => {
    setPlayerName(name);
    setHumanScore(0);
    setAiScore(0);
    setRoundResults([]);
    setScreen('game');
  };

  const handleGameEnd = (hScore, aScore, results) => {
    setHumanScore(hScore);
    setAiScore(aScore);
    setRoundResults(results);

    const existing = JSON.parse(localStorage.getItem('neuroclash_scores') || '[]');
    const newEntry = {
      name: playerName,
      score: hScore,
      date: new Date().toLocaleDateString(),
    };
    const updated = [...existing, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    localStorage.setItem('neuroclash_scores', JSON.stringify(updated));

    setScreen('result');
  };

  const handlePlayAgain = () => {
    setHumanScore(0);
    setAiScore(0);
    setRoundResults([]);
    setScreen('start');
  };

  const handleLeaderboard = () => {
    setScreen('leaderboard');
  };

  const handleBack = () => {
    setScreen('start');
  };

  return (
    <div className="app">
      {screen === 'start' && (
        <StartScreen
          onStart={handleStart}
          onLeaderboard={handleLeaderboard}
        />
      )}
      {screen === 'game' && (
        <GameScreen
          playerName={playerName}
          onGameEnd={handleGameEnd}
        />
      )}
      {screen === 'result' && (
        <ResultScreen
          playerName={playerName}
          humanScore={humanScore}
          aiScore={aiScore}
          roundResults={roundResults}
          onPlayAgain={handlePlayAgain}
          onLeaderboard={handleLeaderboard}
        />
      )}
      {screen === 'leaderboard' && (
        <Leaderboard
          playerName={playerName}
          onBack={handleBack}
        />
      )}
    </div>
  );
}

export default App;