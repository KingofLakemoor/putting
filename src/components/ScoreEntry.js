import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';

const ScoreEntry = ({ holeNumber = 1, par = 3, onSave, onCancel, onPrev, onNext, totalHoles = 9, scoreValue, opponentScoreValue, players = [], opponentId, onSelectOpponent, roundName }) => {
  const [score, setScore] = useState(scoreValue !== undefined ? scoreValue : null);
  const [opponentScore, setOpponentScore] = useState(opponentScoreValue !== undefined ? opponentScoreValue : null);
  const [prevHole, setPrevHole] = useState(holeNumber);

  if (holeNumber !== prevHole) {
    setPrevHole(holeNumber);
    setScore(scoreValue !== undefined ? scoreValue : null);
    setOpponentScore(opponentScoreValue !== undefined ? opponentScoreValue : null);
  }

  // Quick Win: Visual feedback based on score vs par
  const getScoreColor = (s) => {
    if (s === null) return 'text-white border-slate-700 bg-slate-800/50';
    if (s < par) return 'text-kelly-green border-kelly-green bg-kelly-green/10';
    if (s > par) return 'text-red-500 border-red-500 bg-red-500/10';
    return 'text-white border-slate-700 bg-slate-800/50';
  };

  return (
    <div className="bg-dark-bg min-h-screen flex flex-col p-6 text-white font-sans">
      {/* Round Name at Top */}
      {roundName && (
        <div className="text-center text-xs text-slate-400 mb-2 font-bold uppercase tracking-widest">
          {roundName}
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
            <option value="" disabled>Select an opponent (optional)</option>
            {players.map(p => (
              <option key={p.player_id} value={p.player_id}>{p.name}</option>
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
          <h2 className="font-sports text-3xl uppercase tracking-widest">Hole {holeNumber}</h2>
          <p className="font-data text-xs text-slate-500 uppercase">Par {par}</p>
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
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">You</div>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${holeNumber}-user-${score}`}
              initial={{ x: 100, opacity: 0, scale: 0.8 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: -100, opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`w-32 h-32 md:w-40 md:h-40 rounded-3xl border-2 flex items-center justify-center transition-colors duration-300 ${getScoreColor(score)}`}
            >
              <span className="text-6xl md:text-7xl font-data font-black">{score === null ? '-' : score}</span>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center gap-4 md:gap-6">
            <button
              onClick={() => setScore(score === null ? Math.max(1, par - 1) : Math.max(1, score - 1))}
              className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-dark-surface border border-slate-700 flex items-center justify-center active:bg-slate-800 active:scale-95 transition-all"
            >
              <Minus size={24} />
            </button>

            <button
              onClick={() => setScore(score === null ? 1 : score + 1)}
              className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-kelly-green text-dark-bg flex items-center justify-center active:scale-95 transition-all"
            >
              <Plus size={24} />
            </button>
          </div>
        </div>

        {/* Opponent Stepper */}
        {opponentId && (
          <div className="flex flex-col items-center gap-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest truncate max-w-[120px]">
              {players.find(p => p.player_id === opponentId)?.name || 'Opponent'}
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${holeNumber}-opp-${opponentScore}`}
                initial={{ x: 100, opacity: 0, scale: 0.8 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: -100, opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`w-32 h-32 md:w-40 md:h-40 rounded-3xl border-2 flex items-center justify-center transition-colors duration-300 ${getScoreColor(opponentScore)}`}
              >
                <span className="text-6xl md:text-7xl font-data font-black">{opponentScore === null ? '-' : opponentScore}</span>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center gap-4 md:gap-6">
              <button
                onClick={() => setOpponentScore(opponentScore === null ? Math.max(1, par - 1) : Math.max(1, opponentScore - 1))}
                className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-dark-surface border border-slate-700 flex items-center justify-center active:bg-slate-800 active:scale-95 transition-all"
              >
                <Minus size={24} />
              </button>

              <button
                onClick={() => setOpponentScore(opponentScore === null ? 1 : opponentScore + 1)}
                className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-kelly-green text-dark-bg flex items-center justify-center active:scale-95 transition-all"
              >
                <Plus size={24} />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* 9-Hole Quick Nav Grid */}
      <div className="mt-auto pt-8">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 text-center">Round Progress</p>
        <div className="grid grid-cols-9 gap-2">
          {[...Array(totalHoles)].map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full ${i + 1 === holeNumber ? 'bg-kelly-green' : 'bg-slate-800'}`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          <button onClick={onCancel} className="flex items-center justify-center gap-2 py-4 rounded-xl font-bold bg-slate-800 text-slate-400">
            <X size={18} /> CANCEL
          </button>
          {/* Disable SAVE HOLE if scores are not yet filled */}
          <button
            onClick={() => onSave(score, opponentId ? opponentScore : undefined)}
            disabled={score === null || (opponentId && opponentScore === null)}
            className="flex items-center justify-center gap-2 py-4 rounded-xl font-bold bg-kelly-green text-dark-bg shadow-[0_0_20px_rgba(76,187,23,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={18} /> SAVE HOLE
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScoreEntry;