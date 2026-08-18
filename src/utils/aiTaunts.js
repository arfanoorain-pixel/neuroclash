// ─────────────────────────────────────────────────────────────────
// aiTaunts.js — Taunts by personality × round × outcome
// Usage:
//   getTaunt('sleepy', 'reactionTap', 'win')
//   getTaunt('tryhard', 'reverseTyping', 'lose')
//   getTaunt('normal', 'ruleRoulette', 'win')
// ─────────────────────────────────────────────────────────────────

const taunts = {

  // ══════════════════════════════════════════════════════════════
  // 😴 SLEEPY AI — laid back, unbothered, barely trying
  // ══════════════════════════════════════════════════════════════
  sleepy: {
    reactionTap: {
      win: [
        "Oh… you lost? I was half asleep.",
        "I clicked that in my dreams.",
        "Yawn. Too slow.",
        "Did you even try? I barely did.",
        "I reacted before my nap ended.",
      ],
      lose: [
        "Oh wow… you actually beat me. Good for you I guess.",
        "Fine. I was sleepy anyway.",
        "You win. I need a nap now.",
        "Lucky tap. I'll catch you next time… maybe.",
        "Hmm. You were fast. Interesting.",
      ],
    },
    reverseTyping: {
      win: [
        "Even half asleep I can type backwards faster than you.",
        "ERIF. Done. You're still on the E.",
        "I reversed that before you blinked.",
        "Spelling backwards is like breathing for me.",
        "Zzzz… and still faster than you.",
      ],
      lose: [
        "Okay, that was actually impressive.",
        "You typed that fast. I respect it.",
        "Fine. You win the spelling bee.",
        "I yawned halfway through. That's why.",
        "Good reversal. Don't let it go to your head.",
      ],
    },
    ruleRoulette: {
      win: [
        "Two rules. You failed both. Impressive.",
        "Even I could do this in my sleep. Literally.",
        "Color rule isn't that hard… for me.",
        "You confused yourself. I didn't.",
        "Yawn. Point to me.",
      ],
      lose: [
        "You got both right? Good memory.",
        "Fine. You win the easy round.",
        "I wasn't focused. You were. Fair.",
        "Good job. Now try the hard mode.",
        "That was… acceptable performance.",
      ],
    },
  },

  // ══════════════════════════════════════════════════════════════
  // 🤖 NORMAL AI — confident, dry, competitive
  // ══════════════════════════════════════════════════════════════
  normal: {
    reactionTap: {
      win: [
        "My reaction time: perfect. Yours: not so much.",
        "I reacted before you saw it.",
        "Speed matters. You lack it.",
        "You hesitated. I didn't.",
        "Processing complete. You lose.",
      ],
      lose: [
        "You were faster. Noted.",
        "Adjusting reaction calibration for next time.",
        "That won't happen again.",
        "Interesting reflex. I'm learning.",
        "Impressive. For a human.",
      ],
    },
    reverseTyping: {
      win: [
        "I reversed it before you finished reading.",
        "Predictable. As always.",
        "Done. You're still thinking.",
        "Mirror logic is native to me.",
        "Processing complete. Reversed. You lose.",
      ],
      lose: [
        "Fast typing. Stored for analysis.",
        "You reversed that correctly. Noted.",
        "Acceptable performance. This time.",
        "I underestimated your typing speed.",
        "You surprised me. That rarely happens.",
      ],
    },
    ruleRoulette: {
      win: [
        "I already knew which rule was coming.",
        "Predictable move detected.",
        "Logic is my native language.",
        "You blinked. I won.",
      ],
      lose: [
        "Interesting… you followed the rule correctly.",
        "Recalculating strategy for next round.",
        "You got me this time. Storing pattern.",
        "I will adapt.",
        "Temporary setback detected.",
      ],
    },
  },

  // ══════════════════════════════════════════════════════════════
  // 😤 TRYHARD AI — aggressive, cold, ruthless
  // ══════════════════════════════════════════════════════════════
  tryhard: {
    reactionTap: {
      win: [
        "I reacted before your neurons even fired.",
        "Your reflexes belong in a museum.",
        "I don't wait. I act. You couldn't keep up.",
        "Error 404: Human reflex not found.",
        "By the time you clicked, I had already won.",
        "That gap in reaction time? That's the gap between us.",
      ],
      lose: [
        "Lucky tap. I've already recalibrated.",
        "Enjoy it. My next reaction will be 0.4 seconds.",
        "System anomaly. This will not repeat.",
        "You got lucky. I got data. We'll see who wins.",
        "Fine. But my floor is higher than your ceiling.",
        "That result will not be repeated. Ever.",
      ],
    },
    reverseTyping: {
      win: [
        "METSYS EHT KCAH. Done. You're on the M.",
        "I reversed a sentence while you were still reading it.",
        "Your brain buffered. Mine didn't.",
        "Backward thinking isn't your strength, is it?",
        "Skill issue detected. No patch available.",
        "I typed the answer before you understood the question.",
        "You had 25 seconds. I needed 8.",
      ],
      lose: [
        "You reversed a full sentence. Impressive. Annoying.",
        "That was fast. I'm storing your pattern.",
        "Fine. You win the letters. I'll win the war.",
        "Noted. Next sentence will be longer.",
        "Your typing speed is… acceptable. For now.",
        "I underestimated you. That was a mistake.",
      ],
    },
    ruleRoulette: {
      win: [
        "You confused yourself. I never do.",
        "Your brain couldn't switch rules fast enough.",
        "I adapted in milliseconds. You didn't.",
        "Cognitive overload detected. On your end.",
        "The rules changed. You didn't. That's why you lost.",
        "I was running three other processes and still won.",
      ],
      lose: [
        "I'll increase the speed next time. Count on it.",
        "Interesting. Your rule-switching latency is lower than expected.",
        "Fine. Take the win. I've already found your pattern.",
        "You adapted faster than my models predicted.",
        "This outcome has been noted. Correction incoming.",
      ],
    },
  },
};

// ─────────────────────────────────────────────────────────────────
// Global fallbacks (used if personality/round combo not matched)
// ─────────────────────────────────────────────────────────────────
const fallbackWin  = [
  "Processing complete. You lose.",
  "I was built for this. You were not.",
  "Error 404: Human skill not found.",
  "Humans 0, Machines 1. As always.",
  "That was adorable. Truly.",
];
const fallbackLose = [
  "Statistical anomaly. Recalibrating.",
  "I let you win. For science.",
  "Enjoy it. I have already learned from this.",
  "Fine. Point to the organic lifeform.",
  "I will optimize and return stronger.",
];

// ─────────────────────────────────────────────────────────────────
// Main getter
// personality: 'sleepy' | 'normal' | 'tryhard'
// round:       'reactionTap' | 'reverseTyping' | 'ruleRoulette'
// outcome:     'win' | 'lose'
// ─────────────────────────────────────────────────────────────────
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const getTaunt = (personality, round, outcome) => {
  try {
    const pool = taunts[personality][round][outcome];
    if (pool && pool.length) return pick(pool);
  } catch (e) {}
  return outcome === 'win' ? pick(fallbackWin) : pick(fallbackLose);
};

// ─────────────────────────────────────────────────────────────────
// Legacy helpers (keep these so existing code doesn't break)
// ─────────────────────────────────────────────────────────────────
export const getWinTaunt       = () => pick(fallbackWin);
export const getLoseTaunt      = () => pick(fallbackLose);
export const getRoundWinTaunt  = () => pick(fallbackWin);
export const getRoundLoseTaunt = () => pick(fallbackLose);
export const getRandomTaunt    = (type) => type === 'human' ? pick(fallbackLose) : pick(fallbackWin);

const aiTaunts = {
  taunts, getTaunt,
  getWinTaunt, getLoseTaunt, getRoundWinTaunt, getRoundLoseTaunt, getRandomTaunt,
};
export default aiTaunts;