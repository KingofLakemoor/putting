import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';

const ScoreEntry = ({ holeNumber = 1, par = 3, onSave, onCancel, onPrev, onNext, totalHoles = 9, scoreValue }) => {
  const [score, setScore] = useState(scoreValue || par);

  // Quick Win: Visual feedback based on score vs par
  const getScoreColor = () => {
    if (score < par) return 'text-kelly-green border-kelly-green bg-kelly-green/10';
    if (score > par) return 'text-red-500 border-red-500 bg-red-500/10';
    return 'text-white border-slate-700 bg-slate-800/50';
  };

  return (
    <div className="bg-dark-bg min-h-screen flex flex-col p-6 text-white font-sans">
      {/* Header: Navigation between holes */}
      <div className="flex justify-between items-center mb-12">
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
      <div className="flex-1 flex flex-col items-center justify-center gap-8 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${holeNumber}-${score}`}
            initial={{ x: 100, opacity: 0, scale: 0.8 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: -100, opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`w-40 h-40 rounded-3xl border-2 flex items-center justify-center transition-colors duration-300 ${getScoreColor()}`}
          >
            <span className="text-7xl font-data font-black">{score}</span>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center gap-6">
          <button
            onClick={() => setScore(Math.max(1, score - 1))}
            className="w-20 h-20 rounded-2xl bg-dark-surface border border-slate-700 flex items-center justify-center active:bg-slate-800 active:scale-95 transition-all"
          >
            <Minus size={32} />
          </button>

          <button
            onClick={() => setScore(score + 1)}
            className="w-20 h-20 rounded-2xl bg-kelly-green text-dark-bg flex items-center justify-center active:scale-95 transition-all"
          >
            <Plus size={32} />
          </button>
        </div>
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
          <button
            onClick={() => onSave(score)}
            className="flex items-center justify-center gap-2 py-4 rounded-xl font-bold bg-kelly-green text-dark-bg shadow-[0_0_20px_rgba(76,187,23,0.3)]"
          >
            <Check size={18} /> SAVE HOLE
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScoreEntry;