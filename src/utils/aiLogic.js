const aiLogic = {

  getAIReactionTime() {
    return Math.floor(Math.random() * (260 - 180 + 1)) + 180;
  },

  getAIReverseTime() {
    return Math.floor(Math.random() * (3000 - 1800 + 1)) + 1800;
  },

  getAIRulesTime(subRound) {
    const times = [1400, 1100, 800];
    const base = times[subRound] || 800;
    return base + Math.floor(Math.random() * 300);
  },

  didAIWin(humanTime, aiTime) {
    return aiTime < humanTime;
  },

  getAIDifficulty(round) {
    const difficulties = {
      0: { name: 'Easy', reactionBonus: 0 },
      1: { name: 'Moderate', reactionBonus: -20 },
      2: { name: 'Hard', reactionBonus: -40 },
    };
    return difficulties[round] || difficulties[0];
  },

  simulateAITyping(word) {
    const baseTime = 1800;
    const perCharTime = 150;
    const randomFactor = Math.floor(Math.random() * 500);
    return baseTime + word.length * perCharTime + randomFactor;
  },

};

export default aiLogic;