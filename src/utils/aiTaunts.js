const aiTaunts = {

  winTaunts: [
    "Did you just try to beat me? Cute. 🤖",
    "I processed that in nanoseconds. You okay?",
    "Error 404: Human skill not found.",
    "I don't sweat. But you probably do right now.",
    "My grandma's calculator is faster than you.",
    "Beep boop. You lose. Beep boop.",
    "I was literally built for this. You were not.",
    "Congrats! You almost made me try.",
    "Humans 0, Machines 1. As always.",
    "That was adorable. Truly. Now step aside.",
  ],

  loseTaunts: [
    "Okay okay... beginner's luck. Rematch?",
    "I let you win. For science.",
    "My data says this was a statistical anomaly.",
    "You got lucky. My circuits were warming up.",
    "Fine. You win this round, meatbag.",
    "I am... recalibrating. This changes nothing.",
    "Impossible. I am running a full diagnostic.",
    "You cheated. I just cannot prove it yet.",
    "Enjoy it. I have already learned from this.",
    "One loss does not define me. I have 1 trillion parameters.",
  ],

  roundWinTaunts: [
    "Too slow, human.",
    "Predictable. As always.",
    "My reaction time: perfect. Yours: not so much.",
    "I already knew you would do that.",
    "Processing complete. You lose.",
  ],

  roundLoseTaunts: [
    "Interesting move. Storing it for next time.",
    "You surprised me. That rarely happens.",
    "Recalculating strategy...",
    "Lucky guess. Do not get comfortable.",
    "Fine. Point to the organic lifeform.",
  ],

  getRandomTaunt(type) {
    const list = this[type] || this.winTaunts;
    return list[Math.floor(Math.random() * list.length)];
  },

  getWinTaunt() {
    return this.getRandomTaunt('winTaunts');
  },

  getLoseTaunt() {
    return this.getRandomTaunt('loseTaunts');
  },

  getRoundWinTaunt() {
    return this.getRandomTaunt('roundWinTaunts');
  },

  getRoundLoseTaunt() {
    return this.getRandomTaunt('roundLoseTaunts');
  },

};

export default aiTaunts;
export const getRandomTaunt = (type) => aiTaunts.getRandomTaunt(type);
export const getWinTaunt = () => aiTaunts.getWinTaunt();
export const getLoseTaunt = () => aiTaunts.getLoseTaunt();
export const getRoundWinTaunt = () => aiTaunts.getRoundWinTaunt();
export const getRoundLoseTaunt = () => aiTaunts.getRoundLoseTaunt();