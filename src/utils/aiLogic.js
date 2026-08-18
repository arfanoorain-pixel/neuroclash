const aiLogic = {

  // Personality multipliers — higher = slower AI = easier for human
  // sleepy: AI is 1.9x slower than normal
  // normal: 1.0x baseline
  // tryhard: AI is 0.45x = 55% faster than normal (very hard)

  getMultiplier(personality, key) {
    const id = personality?.id || 'normal';
    const table = {
      sleepy:  { reaction: 1.9,  typing: 1.85, rules: 1.8  },
      normal:  { reaction: 1.0,  typing: 1.0,  rules: 1.0  },
      tryhard: { reaction: 0.22, typing: 0.32, rules: 0.35 }
    };
    return table[id]?.[key] ?? 1.0;
  },

  // ReactionTap: base 1200–1800ms
  getAIReactionTime(personality) {
    const base = Math.floor(Math.random() * 500) + 1000;
    return Math.round(base * this.getMultiplier(personality, 'reaction'));
    // sleepy  → ~1700–2550ms
    // normal  → ~850–1275ms  (faster than before)
    // tryhard → ~220–330ms   (nearly impossible to beat)
  },

  // ReverseTyping word AI time
  getAIReverseTime(personality) {
    const base = Math.floor(Math.random() * 650) + 2000;
    return Math.round(base * this.getMultiplier(personality, 'typing'));
  },

  // RuleRoulette per sub-round
  getAIRulesTime(subRound, personality) {
    const bases = [4500, 4000, 3500, 3000, 2500];
    const base  = (bases[subRound] || 2500) + Math.floor(Math.random() * 400);
    return Math.round(base * this.getMultiplier(personality, 'rules'));
    // sleepy  sub0 → ~7200ms
    // normal  sub0 → ~3825ms  (tighter)
    // tryhard sub0 → ~1575ms  (very hard)
  },

  didAIWin(humanTime, aiTime) {
    return aiTime < humanTime;
  },

  // ReverseTyping sentence/word simulation
simulateAITyping(word, personality) {
    const id = personality?.id || 'normal';

    if (id === 'tryhard') {
      // AI time = 120ms per char + small random — very fast
      // 15-char sentence → ~1800 + 300 random = ~2100ms
      // Player has 30s so they can win — but only if they're fast
      return Math.round(120 * word.length + Math.floor(Math.random() * 300) + 800);
    }

    const baseTime     = 2500;
    const perCharTime  = id === 'sleepy' ? 220 : 160;
    const randomFactor = Math.floor(Math.random() * 500);
    const raw          = baseTime + word.length * perCharTime + randomFactor;
    return Math.round(raw * this.getMultiplier(personality, 'typing'));
    // sleepy  6-char → ~(2500+1320+500)*1.6 ≈ 6900ms
    // normal  6-char → ~(2500+960+500)*0.85 ≈ 3370ms
  },

};

export default aiLogic;