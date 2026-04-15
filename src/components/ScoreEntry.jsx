import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog } from "@headlessui/react";
import {
  Minus,
  Plus,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { formatDisplayName } from "../utils/format";

const ScoreEntry = ({
  holeNumber = 1,
  par = 3,
  onScoreChange,
  onAdvance,
  onCancel,
  onDiscard,
  onPrev,
  onNext,
  totalHoles = 9,
  scoreValue,
  opponentScoreValue,
  allScores = {},
  allOpponentScores = {},
  holesData = [],
  onGoToHole,
  players = [],
  opponentId,
  onSelectOpponent,
  roundName,
  error,
  playerName,
  userStrokes,
  userRelative,
  opponentStrokes,
  opponentRelative,
}) => {
  const [score, setScore] = useState(
    scoreValue !== undefined ? scoreValue : null,
  );
  const [opponentScore, setOpponentScore] = useState(
    opponentScoreValue !== undefined ? opponentScoreValue : null,
  );
  const [prevHole, setPrevHole] = useState(holeNumber);
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);

  if (holeNumber !== prevHole) {
    setPrevHole(holeNumber);
    setScore(scoreValue !== undefined ? scoreValue : null);
    setOpponentScore(
      opponentScoreValue !== undefined ? opponentScoreValue : null,
    );
  }

  const handleScoreUpdate = (newVal) => {
    setScore(newVal);
    if (onScoreChange) onScoreChange(newVal, opponentScore);
  };

  const handleOpponentScoreUpdate = (newVal) => {
    setOpponentScore(newVal);
    if (onScoreChange) onScoreChange(score, newVal);
  };

  const formatRelativeScore = (relative) => {
    if (relative === 0) return "E";
    return relative > 0 ? `+${relative}` : `${relative}`;
  };

  // Quick Win: Visual feedback based on score vs par
  const getScoreColor = (s) => {
    if (s === null) return "text-white border-slate-700 bg-slate-800/50";
    if (s < par) return "text-kelly-green border-kelly-green bg-kelly-green/10";
    if (s > par) return "text-red-500 border-red-500 bg-red-500/10";
    return "text-white border-slate-700 bg-slate-800/50";
  };

  const renderScoreWithSymbol = (score, holePar) => {
    if (score === null || score === undefined) return "-";
    const diff = score - holePar;

    let containerClass =
      "flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 font-data font-bold text-xs sm:text-sm mx-auto transition-colors";

    if (diff === -1) {
      containerClass +=
        " rounded-full border border-kelly-green text-kelly-green";
    } else if (diff <= -2) {
      containerClass += " rounded-full bg-kelly-green text-dark-bg";
    } else if (diff === 1) {
      containerClass += " border border-slate-400 text-slate-300";
    } else if (diff >= 2) {
      containerClass += " border-2 border-slate-400 text-slate-300";
    } else {
      containerClass += " text-white";
    }

    return <div className={containerClass}>{score}</div>;
  };

  return (
    <div className="bg-dark-bg min-h-screen flex flex-col p-6 text-white font-sans">
      {/* Round Name at Top */}
      {roundName && (
        <div className="text-center text-xs text-slate-400 mb-2 font-bold uppercase tracking-widest">
          {roundName}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 text-red-500 p-3 mb-4 rounded-xl text-xs font-bold uppercase tracking-wider text-center">
          {error}
        </div>
      )}

      {/* Opponent Selection Dropdown */}
      {!opponentId && players.length > 0 && (
        <div className="mb-4">
          <select
            onChange={(e) => onSelectOpponent(e.target.value)}
            className="w-full bg-dark-surface border border-slate-700 rounded-xl px-4 py-2 text-white focus:border-kelly-green focus:outline-none transition-colors text-sm"
            value={opponentId || ""}
          >
            <option value="" disabled>
              Select an opponent (optional)
            </option>
            {players.map((p) => (
              <option key={p.player_id} value={p.player_id}>
                {formatDisplayName(p.name, players)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Header: Navigation between holes */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onPrev}
          disabled={holeNumber <= 1}
          className="p-3 rounded-full bg-dark-surface border border-slate-800 disabled:opacity-50"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="text-center">
          <h2 className="font-sports text-3xl uppercase tracking-widest">
            Hole {holeNumber}
          </h2>
          <p className="font-data text-xs text-slate-500 uppercase">
            Par {par}
          </p>
        </div>
        <button
          onClick={onNext}
          disabled={holeNumber >= totalHoles}
          className="p-3 rounded-full bg-dark-surface border border-slate-800 disabled:opacity-50"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Main Stepper: Massive touch targets */}
      <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 overflow-hidden">
        {/* User Stepper */}
        <div className="flex flex-col items-center gap-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
            {formatDisplayName(playerName, players)} (
            {formatRelativeScore(userRelative)}) {userStrokes}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${holeNumber}-user`}
              initial={{ x: 100, opacity: 0, scale: 0.8 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: -100, opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`w-24 h-24 md:w-32 md:h-32 rounded-3xl border-2 flex items-center justify-center transition-colors duration-300 ${getScoreColor(score)}`}
            >
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={score}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="text-6xl md:text-7xl font-data font-black"
                >
                  {score === null ? "-" : score}
                </motion.span>
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center gap-4 md:gap-6">
            <button
              onClick={() =>
                handleScoreUpdate(score === null ? 1 : Math.max(1, score - 1))
              }
              className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-dark-surface border border-slate-700 flex items-center justify-center active:bg-slate-800 active:scale-95 transition-all"
            >
              <Minus size={24} />
            </button>

            <button
              onClick={() => handleScoreUpdate(score === null ? 1 : score + 1)}
              className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-kelly-green text-dark-bg flex items-center justify-center active:scale-95 transition-all"
            >
              <Plus size={24} />
            </button>
          </div>
        </div>

        {/* Opponent Stepper */}
        {opponentId && (
          <div className="flex flex-col items-center gap-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
              {(() => {
                const playersMap = new Map();
                for (const p of players) {
                  if (p.player_id) playersMap.set(p.player_id, p);
                }
                const oppName = playersMap.get(opponentId)?.name || "Opponent";
                return `${formatDisplayName(oppName, players)} (${formatRelativeScore(opponentRelative)}) ${opponentStrokes}`;
              })()}
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${holeNumber}-opp`}
                initial={{ x: 100, opacity: 0, scale: 0.8 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: -100, opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`w-24 h-24 md:w-32 md:h-32 rounded-3xl border-2 flex items-center justify-center transition-colors duration-300 ${getScoreColor(opponentScore)}`}
              >
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={opponentScore}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.5, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="text-6xl md:text-7xl font-data font-black"
                  >
                    {opponentScore === null ? "-" : opponentScore}
                  </motion.span>
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center gap-4 md:gap-6">
              <button
                onClick={() =>
                  handleOpponentScoreUpdate(
                    opponentScore === null ? 1 : Math.max(1, opponentScore - 1),
                  )
                }
                className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-dark-surface border border-slate-700 flex items-center justify-center active:bg-slate-800 active:scale-95 transition-all"
              >
                <Minus size={24} />
              </button>

              <button
                onClick={() =>
                  handleOpponentScoreUpdate(
                    opponentScore === null ? 1 : opponentScore + 1,
                  )
                }
                className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-kelly-green text-dark-bg flex items-center justify-center active:scale-95 transition-all"
              >
                <Plus size={24} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Scorecard Grid */}
      <div className="mt-auto pt-4 w-full">
        <div className="overflow-x-auto w-full pb-2">
          <div className="min-w-max border border-slate-800 rounded-xl overflow-hidden bg-dark-surface">
            {/* Hole Row */}
            <div className="flex border-b border-slate-800">
              <div className="w-16 sm:w-20 shrink-0 bg-slate-900/50 p-2 flex items-center justify-center border-r border-slate-800 text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Hole
              </div>
              {holesData.map((h) => (
                <div
                  key={`hole-${h.hole}`}
                  onClick={() => onGoToHole && onGoToHole(h.hole)}
                  className={`w-10 sm:w-12 shrink-0 p-2 flex items-center justify-center font-sports text-sm sm:text-base border-r border-slate-800 cursor-pointer transition-colors
                  ${h.hole === holeNumber ? "bg-kelly-green/20 text-kelly-green" : "text-slate-300 hover:bg-slate-800/50"}
                `}
                >
                  {h.hole}
                </div>
              ))}
            </div>

            {/* Par Row */}
            <div className="flex border-b border-slate-800">
              <div className="w-16 sm:w-20 shrink-0 bg-slate-900/50 p-2 flex items-center justify-center border-r border-slate-800 text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Par
              </div>
              {holesData.map((h) => (
                <div
                  key={`par-${h.hole}`}
                  onClick={() => onGoToHole && onGoToHole(h.hole)}
                  className={`w-10 sm:w-12 shrink-0 p-2 flex items-center justify-center font-data text-xs sm:text-sm border-r border-slate-800 cursor-pointer transition-colors text-slate-500
                  ${h.hole === holeNumber ? "bg-kelly-green/10" : "hover:bg-slate-800/50"}
                `}
                >
                  {h.par}
                </div>
              ))}
            </div>

            {/* Player Score Row */}
            <div
              className={`flex ${opponentId ? "border-b border-slate-800" : ""}`}
            >
              <div className="w-16 sm:w-20 shrink-0 bg-slate-900/50 p-2 flex items-center justify-center border-r border-slate-800 text-[9px] sm:text-[10px] font-bold text-white uppercase tracking-widest truncate">
                {formatDisplayName(playerName, players).split(" ")[0]}
              </div>
              {holesData.map((h) => (
                <div
                  key={`score-${h.hole}`}
                  onClick={() => onGoToHole && onGoToHole(h.hole)}
                  className={`w-10 sm:w-12 shrink-0 p-1 flex items-center justify-center border-r border-slate-800 cursor-pointer transition-colors
                  ${h.hole === holeNumber ? "bg-kelly-green/10" : "hover:bg-slate-800/50"}
                `}
                >
                  {renderScoreWithSymbol(allScores[h.hole], h.par)}
                </div>
              ))}
            </div>

            {/* Opponent Score Row */}
            {opponentId && (
              <div className="flex">
                <div className="w-16 sm:w-20 shrink-0 bg-slate-900/50 p-2 flex items-center justify-center border-r border-slate-800 text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                  {(() => {
                    const playersMap = new Map();
                    for (const p of players) {
                      if (p.player_id) playersMap.set(p.player_id, p);
                    }
                    const oppName = playersMap.get(opponentId)?.name || "Opp";
                    return formatDisplayName(oppName, players).split(" ")[0];
                  })()}
                </div>
                {holesData.map((h) => (
                  <div
                    key={`opp-score-${h.hole}`}
                    onClick={() => onGoToHole && onGoToHole(h.hole)}
                    className={`w-10 sm:w-12 shrink-0 p-1 flex items-center justify-center border-r border-slate-800 cursor-pointer transition-colors
                      ${h.hole === holeNumber ? "bg-kelly-green/10" : "hover:bg-slate-800/50"}
                    `}
                  >
                    {renderScoreWithSymbol(allOpponentScores[h.hole], h.par)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onCancel}
              className="flex items-center justify-center gap-2 py-4 rounded-xl font-bold bg-slate-800 text-slate-400 text-xs"
            >
              <X size={16} /> CANCEL
            </button>
            <button
              onClick={() => setIsDiscardModalOpen(true)}
              className="flex items-center justify-center gap-2 py-4 rounded-xl font-bold border border-red-900/30 text-red-500/70 text-xs hover:bg-red-950/20"
            >
              <RotateCcw size={16} /> DISCARD
            </button>
          </div>
          <button
            onClick={() => onAdvance()}
            disabled={score === null || (opponentId && opponentScore === null)}
            className="flex items-center justify-center gap-2 py-4 rounded-xl font-bold bg-kelly-green text-dark-bg shadow-[0_0_20px_rgba(76,187,23,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={18} />{" "}
            {holeNumber >= totalHoles ? "FINISH ROUND" : "NEXT HOLE"}
          </button>
        </div>
      </div>

      {/* Discard Confirmation Modal */}
      <AnimatePresence>
        {isDiscardModalOpen && (
          <Dialog
            static
            as={motion.div}
            open={isDiscardModalOpen}
            onClose={() => setIsDiscardModalOpen(false)}
            className="relative z-50"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <Dialog.Panel
                  as={motion.div}
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="w-full max-w-sm bg-dark-surface border border-slate-700/50 rounded-2xl p-6 text-white shadow-xl text-center"
                >
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                      <RotateCcw className="text-red-500" size={32} />
                    </div>
                  </div>
                  <Dialog.Title className="font-sports text-2xl text-red-500 tracking-wide mb-2">
                    Discard Round?
                  </Dialog.Title>
                  <Dialog.Description className="text-slate-400 text-sm mb-8">
                    Are you sure you want to discard this round? This action
                    cannot be undone and your progress will be lost.
                  </Dialog.Description>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setIsDiscardModalOpen(false)}
                      className="flex-1 py-3 rounded-xl font-bold bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 transition-colors"
                    >
                      CANCEL
                    </button>
                    <button
                      onClick={() => {
                        setIsDiscardModalOpen(false);
                        if (onDiscard) onDiscard();
                      }}
                      className="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white text-sm hover:bg-red-600 transition-colors"
                    >
                      DISCARD
                    </button>
                  </div>
                </Dialog.Panel>
              </div>
            </div>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScoreEntry;
