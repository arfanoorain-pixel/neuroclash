import { useState, useEffect, useRef, useCallback } from "react";
import soundEffects from "../utils/soundEffects";

const PHASES = {
  IDLE: "idle",
  WAITING: "waiting",
  GREEN: "green",
  RESULT: "result",
};

const styles = {
  root: {
    position: "fixed",
    inset: 0,
    fontFamily: "'Courier New', monospace",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    userSelect: "none",
    cursor: "default",
    transition: "background 0.08s ease",
  },
  scanline: {
    position: "absolute",
    inset: 0,
    background:
      "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
    pointerEvents: "none",
    zIndex: 10,
  },
  vignette: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.75) 100%)",
    pointerEvents: "none",
    zIndex: 11,
  },
  cornerTL: {
    position: "absolute",
    top: 24,
    left: 24,
    width: 40,
    height: 40,
    borderTop: "2px solid",
    borderLeft: "2px solid",
    opacity: 0.6,
    zIndex: 12,
  },
  cornerTR: {
    position: "absolute",
    top: 24,
    right: 24,
    width: 40,
    height: 40,
    borderTop: "2px solid",
    borderRight: "2px solid",
    opacity: 0.6,
    zIndex: 12,
  },
  cornerBL: {
    position: "absolute",
    bottom: 24,
    left: 24,
    width: 40,
    height: 40,
    borderBottom: "2px solid",
    borderLeft: "2px solid",
    opacity: 0.6,
    zIndex: 12,
  },
  cornerBR: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 40,
    height: 40,
    borderBottom: "2px solid",
    borderRight: "2px solid",
    opacity: 0.6,
    zIndex: 12,
  },
  content: {
    position: "relative",
    zIndex: 20,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 20,
    padding: "0 32px",
    textAlign: "center",
  },
  roundLabel: {
    fontSize: 11,
    letterSpacing: "0.3em",
    textTransform: "uppercase",
    opacity: 0.5,
    marginBottom: -8,
  },
  bigLabel: {
    fontSize: "clamp(2.2rem, 8vw, 4.5rem)",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    lineHeight: 1.05,
    margin: 0,
    textShadow: "0 0 40px currentColor",
  },
  subLabel: {
    fontSize: "clamp(0.75rem, 2.5vw, 1rem)",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    opacity: 0.7,
    margin: 0,
  },
  timeRow: {
    display: "flex",
    gap: 32,
    marginTop: 8,
  },
  timeBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  timeLabel: {
    fontSize: 10,
    letterSpacing: "0.25em",
    textTransform: "uppercase",
    opacity: 0.5,
  },
  timeValue: {
    fontSize: "clamp(1.4rem, 4vw, 2rem)",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    textShadow: "0 0 20px currentColor",
  },
  winnerBadge: {
    fontSize: 11,
    letterSpacing: "0.3em",
    textTransform: "uppercase",
    padding: "3px 10px",
    border: "1px solid",
    borderRadius: 2,
    opacity: 0.9,
  },
  ctaBtn: {
    marginTop: 12,
    padding: "12px 36px",
    fontSize: "0.85rem",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    fontFamily: "'Courier New', monospace",
    fontWeight: 700,
    border: "2px solid",
    background: "transparent",
    cursor: "pointer",
    transition: "all 0.15s ease",
    borderRadius: 2,
  },
  earlyTap: {
    fontSize: "clamp(1rem, 3vw, 1.4rem)",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    opacity: 0.9,
  },
  glitchLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    opacity: 0,
    zIndex: 15,
    pointerEvents: "none",
  },
};

const themes = {
  idle: {
    bg: "#0a0a0f",
    accent: "#00f0ff",
    text: "#c8d8ff",
    corner: "#00f0ff",
  },
  waiting: {
    bg: "#0f0a00",
    accent: "#ff6600",
    text: "#ffd080",
    corner: "#ff6600",
  },
  green: {
    bg: "#001a05",
    accent: "#00ff66",
    text: "#00ff66",
    corner: "#00ff66",
  },
  result_human: {
    bg: "#00100a",
    accent: "#00ff66",
    text: "#b0ffe0",
    corner: "#00ff66",
  },
  result_ai: {
    bg: "#120010",
    accent: "#ff00cc",
    text: "#ffb0f0",
    corner: "#ff00cc",
  },
  result_tie: {
    bg: "#0a0a00",
    accent: "#ffee00",
    text: "#fff8b0",
    corner: "#ffee00",
  },
  early: {
    bg: "#1a0000",
    accent: "#ff2244",
    text: "#ffaaaa",
    corner: "#ff2244",
  },
};

function getTheme(phase, winner) {
  if (phase === PHASES.IDLE) return themes.idle;
  if (phase === PHASES.WAITING) return themes.waiting;
  if (phase === PHASES.GREEN) return themes.green;
  if (phase === PHASES.RESULT) {
    if (winner === "human") return themes.result_human;
    if (winner === "ai") return themes.result_ai;
    return themes.result_tie;
  }
  return themes.idle;
}

function useFlash(active) {
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (!active) return;
    let on = true;
    const cycle = () => {
      setFlash((f) => !f);
      if (on) timeout = setTimeout(cycle, 80 + Math.random() * 60);
    };
    let timeout = setTimeout(cycle, 100);
    return () => {
      on = false;
      clearTimeout(timeout);
      setFlash(false);
    };
  }, [active]);
  return flash;
}

export default function ReactionTap({ onRoundEnd }) {
  const [phase, setPhase] = useState(PHASES.IDLE);
  const [winner, setWinner] = useState(null);
  const [humanTime, setHumanTime] = useState(null);
  const [aiTime, setAiTime] = useState(null);
  const [earlyTap, setEarlyTap] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [humanDone, setHumanDone] = useState(false);
  const [btnHover, setBtnHover] = useState(false);

  const greenStartRef = useRef(null);
  const aiTimerRef = useRef(null);
  const waitTimerRef = useRef(null);
  const resolvedRef = useRef(false);

  const flashActive = phase === PHASES.WAITING;
  const flash = useFlash(flashActive);

  const theme = getTheme(phase, winner);

  const cleanup = useCallback(() => {
    clearTimeout(aiTimerRef.current);
    clearTimeout(waitTimerRef.current);
  }, []);

  const resolveRound = useCallback(
    (hTime, aTime) => {
      if (resolvedRef.current) return;
      resolvedRef.current = true;
      cleanup();

      let w;
      if (hTime === null && aTime !== null) w = "ai";
      else if (aTime === null && hTime !== null) w = "human";
      else if (hTime < aTime) w = "human";
      else if (aTime < hTime) w = "ai";
      else w = "tie";

      setWinner(w);
      setHumanTime(hTime);
      setAiTime(aTime);
      setPhase(PHASES.RESULT);

      // 🔊 Play win/lose sound on result
      if (w === "human") soundEffects.playRoundWinSound();
      else if (w === "ai") soundEffects.playRoundLoseSound();
      else soundEffects.playCountdownSound();
    },
    [cleanup]
  );

  const startRound = useCallback(() => {
    resolvedRef.current = false;
    setPhase(PHASES.IDLE);
    setWinner(null);
    setHumanTime(null);
    setAiTime(null);
    setEarlyTap(false);
    setAiDone(false);
    setHumanDone(false);

    const waitMs = 1500 + Math.random() * 2500;

    waitTimerRef.current = setTimeout(() => {
      setEarlyTap(false);
      setPhase(PHASES.GREEN);
      greenStartRef.current = performance.now();

      // 🔊 Play flash sound when screen goes green
      soundEffects.playFlashSound();

      const aiReaction = 450 + Math.random() * 100;
      aiTimerRef.current = setTimeout(() => {
        const aTime = Math.round(performance.now() - greenStartRef.current);
        setAiTime(aTime);
        setAiDone(true);
      }, aiReaction);
    }, waitMs);

    setTimeout(() => setPhase(PHASES.WAITING), 300);
  }, []);

  useEffect(() => {
    if (phase !== PHASES.GREEN) return;
    if (resolvedRef.current) return;
    if (aiDone) {
    }
  }, [aiDone, phase]);

  useEffect(() => {
    if (!aiDone || !humanDone) return;
    resolveRound(humanTime, aiTime);
  }, [aiDone, humanDone, humanTime, aiTime, resolveRound]);

  useEffect(() => {
    if (phase !== PHASES.GREEN) return;
    const timeout = setTimeout(() => {
      if (!resolvedRef.current) {
        resolveRound(null, aiTime ?? Math.round(180 + Math.random() * 80));
      }
    }, 3000);
    return () => clearTimeout(timeout);
  }, [phase, aiTime, resolveRound]);

  useEffect(() => () => cleanup(), [cleanup]);

  const handleScreenTap = useCallback(() => {
    if (phase === PHASES.IDLE) return;

    if (phase === PHASES.WAITING) {
      // 🔊 Play wrong/buzz sound for early tap
      soundEffects.playWrongSound();
      setEarlyTap(true);
      cleanup();
      setPhase(PHASES.IDLE);
      setTimeout(() => {
        setEarlyTap(false);
        startRound();
      }, 1800);
      return;
    }

    if (phase === PHASES.GREEN && !humanDone) {
      // 🔊 Play click sound on valid tap
      soundEffects.playClickSound();
      const hTime = Math.round(performance.now() - greenStartRef.current);
      setHumanTime(hTime);
      setHumanDone(true);
    }
  }, [phase, humanDone, cleanup, startRound]);

  const handleNextRound = useCallback(() => {
    if (onRoundEnd) {
      onRoundEnd(winner, humanTime, aiTime);
    }
  }, [onRoundEnd, winner, humanTime, aiTime]);

  const bgColor =
    phase === PHASES.WAITING
      ? flash
        ? "#1a0f00"
        : "#0f0a00"
      : theme.bg;

  const bgStyle = {
    ...styles.root,
    background: bgColor,
    boxShadow:
      phase === PHASES.GREEN
        ? `inset 0 0 120px rgba(0,255,102,0.18), inset 0 0 40px rgba(0,255,102,0.1)`
        : "none",
  };

  const renderContent = () => {
    if (earlyTap) {
      return (
        <>
          <p style={{ ...styles.roundLabel, color: themes.early.accent }}>
            Round 1 · Easy
          </p>
          <h1
            style={{
              ...styles.bigLabel,
              color: themes.early.accent,
              fontSize: "clamp(2rem,7vw,3.8rem)",
            }}
          >
            TOO EARLY
          </h1>
          <p style={{ ...styles.subLabel, color: themes.early.text }}>
            Restarting…
          </p>
        </>
      );
    }

    if (phase === PHASES.IDLE) {
      return (
        <>
          <p style={{ ...styles.roundLabel, color: theme.accent }}>
            Round 1 · Easy
          </p>
          <h1 style={{ ...styles.bigLabel, color: theme.accent }}>
            REACTION TAP
          </h1>
          <p style={{ ...styles.subLabel, color: theme.text }}>
            Tap when the screen turns green
          </p>
          <button
            style={{
              ...styles.ctaBtn,
              color: theme.accent,
              borderColor: theme.accent,
              boxShadow: btnHover
                ? `0 0 24px ${theme.accent}88`
                : `0 0 8px ${theme.accent}44`,
              background: btnHover ? `${theme.accent}18` : "transparent",
            }}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
            onClick={(e) => {
              e.stopPropagation();
              startRound();
            }}
          >
            START
          </button>
        </>
      );
    }

    if (phase === PHASES.WAITING) {
      return (
        <>
          <p style={{ ...styles.roundLabel, color: theme.accent }}>
            Round 1 · Easy
          </p>
          <h1
            style={{
              ...styles.bigLabel,
              color: theme.accent,
              animation: "pulse 0.6s ease-in-out infinite alternate",
            }}
          >
            WAIT…
          </h1>
          <p style={{ ...styles.subLabel, color: theme.text }}>
            Don't tap yet — screen will flash green
          </p>
        </>
      );
    }

    if (phase === PHASES.GREEN) {
      return (
        <>
          <p style={{ ...styles.roundLabel, color: theme.accent }}>
            Round 1 · Easy
          </p>
          <h1
            style={{
              ...styles.bigLabel,
              color: theme.accent,
              fontSize: "clamp(3rem,12vw,6rem)",
              animation: "slam 0.12s ease-out",
            }}
          >
            TAP!
          </h1>
          <p style={{ ...styles.subLabel, color: theme.text }}>
            {humanDone ? "Waiting for AI…" : "NOW — as fast as you can!"}
          </p>
        </>
      );
    }

    if (phase === PHASES.RESULT) {
      const tie = winner === "tie";
      const humanWon = winner === "human";
      const aiWon = winner === "ai";

      return (
        <>
          <p style={{ ...styles.roundLabel, color: theme.accent }}>
            Round 1 · Easy · Result
          </p>
          <h1
            style={{
              ...styles.bigLabel,
              color: theme.accent,
              fontSize: "clamp(2rem,7vw,3.8rem)",
            }}
          >
            {tie ? "DEAD HEAT" : humanWon ? "YOU WIN!" : "AI WINS"}
          </h1>

          <div style={styles.timeRow}>
            <div style={styles.timeBox}>
              <span style={{ ...styles.timeLabel, color: theme.text }}>
                You
              </span>
              <span
                style={{
                  ...styles.timeValue,
                  color: humanWon ? "#00ff66" : aiWon ? "#ff2255" : "#ffee00",
                  textShadow: `0 0 20px ${humanWon ? "#00ff66" : aiWon ? "#ff2255" : "#ffee00"}`,
                }}
              >
                {humanTime !== null ? `${humanTime}ms` : "—"}
              </span>
              {humanWon && (
                <span
                  style={{
                    ...styles.winnerBadge,
                    color: "#00ff66",
                    borderColor: "#00ff66",
                  }}
                >
                  FASTER
                </span>
              )}
            </div>

            <div
              style={{
                width: 1,
                background: `${theme.accent}33`,
                alignSelf: "stretch",
              }}
            />

            <div style={styles.timeBox}>
              <span style={{ ...styles.timeLabel, color: theme.text }}>
                AI
              </span>
              <span
                style={{
                  ...styles.timeValue,
                  color: aiWon ? "#ff00cc" : humanWon ? "#555" : "#ffee00",
                  textShadow: `0 0 20px ${aiWon ? "#ff00cc" : humanWon ? "#333" : "#ffee00"}`,
                }}
              >
                {aiTime !== null ? `${aiTime}ms` : "—"}
              </span>
              {aiWon && (
                <span
                  style={{
                    ...styles.winnerBadge,
                    color: "#ff00cc",
                    borderColor: "#ff00cc",
                  }}
                >
                  FASTER
                </span>
              )}
            </div>
          </div>

          {!tie && (
            <p
              style={{
                ...styles.subLabel,
                color: theme.text,
                fontSize: "0.75rem",
                opacity: 0.5,
              }}
            >
              {humanWon
                ? `You beat the AI by ${aiTime - humanTime}ms`
                : humanTime === null
                ? "You didn't tap in time"
                : `AI beat you by ${humanTime - aiTime}ms`}
            </p>
          )}

          <button
            style={{
              ...styles.ctaBtn,
              marginTop: 8,
              color: theme.accent,
              borderColor: theme.accent,
              boxShadow: btnHover
                ? `0 0 24px ${theme.accent}88`
                : `0 0 8px ${theme.accent}44`,
              background: btnHover ? `${theme.accent}18` : "transparent",
            }}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
            onClick={(e) => {
              e.stopPropagation();
              handleNextRound();
            }}
          >
            NEXT ROUND →
          </button>
        </>
      );
    }
  };

  return (
    <>
      <style>{`
        @keyframes pulse {
          from { opacity: 0.6; transform: scale(1); }
          to   { opacity: 1;   transform: scale(1.04); }
        }
        @keyframes slam {
          from { transform: scale(1.35); opacity: 0.5; }
          to   { transform: scale(1);    opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={bgStyle} onClick={handleScreenTap}>
        <div style={styles.scanline} />
        <div style={styles.vignette} />

        <div style={{ ...styles.cornerTL, borderColor: theme.corner }} />
        <div style={{ ...styles.cornerTR, borderColor: theme.corner }} />
        <div style={{ ...styles.cornerBL, borderColor: theme.corner }} />
        <div style={{ ...styles.cornerBR, borderColor: theme.corner }} />

        {phase !== PHASES.IDLE && (
          <div
            style={{
              position: "absolute",
              top: 28,
              left: 72,
              zIndex: 20,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <span
              style={{
                fontSize: 9,
                letterSpacing: "0.25em",
                color: theme.accent,
                opacity: 0.45,
                textTransform: "uppercase",
              }}
            >
              NEUROCLASH
            </span>
            <span
              style={{
                fontSize: 9,
                letterSpacing: "0.2em",
                color: theme.text,
                opacity: 0.3,
                textTransform: "uppercase",
              }}
            >
              AI vs Human
            </span>
          </div>
        )}

        {phase === PHASES.GREEN && (
          <div
            style={{
              position: "absolute",
              top: 28,
              right: 72,
              zIndex: 20,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#00ff66",
                boxShadow: "0 0 12px #00ff66",
                animation: "pulse 0.4s ease-in-out infinite alternate",
              }}
            />
            <span
              style={{
                fontSize: 9,
                letterSpacing: "0.2em",
                color: "#00ff66",
                opacity: 0.7,
                textTransform: "uppercase",
              }}
            >
              LIVE
            </span>
          </div>
        )}

        <div style={styles.content}>{renderContent()}</div>
      </div>
    </>
  );
}