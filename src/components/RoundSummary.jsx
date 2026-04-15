import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Share2,
  RotateCcw,
  Trophy,
  Target,
  X,
} from "lucide-react";
import { Dialog } from "@headlessui/react";
import { toast } from "react-hot-toast";

const RoundSummary = ({
  roundData,
  onFinalize,
  onDiscard,
  isPB,
  isSubmitting,
}) => {
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);

  // Calculate total and identifies highlights
  const scores = Object.values(roundData.scores || {});
  const totalScore = scores.reduce((a, b) => a + b, 0);
  const birdies = scores.filter((s) => s < 3).length; // Assuming Par 3 for all holes

  const opponentScores = Object.values(roundData.opponent_scores || {});
  const opponentTotalScore = opponentScores.reduce((a, b) => a + b, 0);

  const handleDiscardClick = () => {
    setIsDiscardModalOpen(true);
  };

  const confirmDiscard = () => {
    setIsDiscardModalOpen(false);
    onDiscard();
  };

  const cancelDiscard = () => {
    setIsDiscardModalOpen(false);
  };

  let dateStr = "UNKNOWN DATE";
  if (roundData.date && !isNaN(new Date(roundData.date).getTime())) {
    dateStr = new Date(roundData.date)
      .toLocaleDateString("en-US", { timeZone: "UTC" })
      .toUpperCase();
  } else {
    dateStr = new Date()
      .toLocaleDateString("en-US", { timeZone: "UTC" })
      .toUpperCase();
  }

  const locationStr = roundData.location
    ? roundData.location.toUpperCase()
    : "DOBSON RANCH";
  const roundName =
    roundData?.event_round_name || roundData?.name || "Casual Round";

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: "Club 602 Round Summary",
          text: `I just scored ${totalScore} with ${birdies} birdies at ${locationStr}! #Club602`,
        })
        .catch((err) => {
          console.error("Error sharing:", err);
        });
    } else {
      toast.success("Sharing not supported on this browser");
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white p-6 flex flex-col font-sans">
      {/* Round Name at Top */}
      <div className="text-center text-xs text-slate-400 mb-2 font-bold uppercase tracking-widest">
        {roundName}
      </div>

      {/* Success Header */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center mb-8 mt-4"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-kelly-green/20 mb-4">
          <CheckCircle2 className="text-kelly-green" size={48} />
        </div>
        <h1 className="font-sports text-4xl uppercase tracking-tight">
          Round Complete
        </h1>
        <p className="text-slate-500 font-data text-xs mt-1">
          {locationStr} • {dateStr}
        </p>
      </motion.div>

      {/* Hero Stats Section */}
      <div
        className={`grid gap-4 mb-8 ${roundData.opponent_id ? "grid-cols-3" : "grid-cols-2"}`}
      >
        <div className="bg-dark-surface border border-slate-800 p-4 sm:p-6 rounded-2xl text-center relative overflow-hidden">
          {isPB && (
            <div className="absolute top-0 left-0 w-full bg-gradient-to-r from-kelly-green/80 to-kelly-green text-[10px] font-bold text-dark-bg uppercase tracking-widest py-1">
              Personal Best
            </div>
          )}
          <p
            className={`text-[9px] sm:text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1 ${isPB ? "mt-3" : ""}`}
          >
            Your Score
          </p>
          <p className="text-4xl sm:text-5xl font-data font-black text-white">
            {totalScore}
          </p>
        </div>

        {roundData.opponent_id && (
          <div className="bg-dark-surface border border-slate-800 p-4 sm:p-6 rounded-2xl text-center">
            <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">
              Opponent
            </p>
            <p className="text-4xl sm:text-5xl font-data font-black text-white">
              {opponentTotalScore}
            </p>
          </div>
        )}

        <div className="bg-dark-surface border border-slate-800 p-4 sm:p-6 rounded-2xl text-center">
          <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">
            Birdies
          </p>
          <p className="text-4xl sm:text-5xl font-data font-black text-kelly-green">
            {birdies}
          </p>
        </div>
      </div>

      {/* Hole-by-Hole Mini Grid */}
      <div className="bg-dark-surface border border-slate-800 rounded-2xl p-4 mb-8">
        <h3 className="text-[10px] text-slate-500 font-bold uppercase mb-4 text-center">
          Scorecard Detail
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(roundData.scores || {}).map(([hole, score]) => (
            <div
              key={hole}
              className="flex flex-col items-center bg-dark-bg/50 p-3 rounded-xl border border-slate-800"
            >
              <span className="text-[10px] text-slate-600 font-bold">
                H{hole}
              </span>
              <span
                className={`text-xl font-data font-bold ${score < 3 ? "text-kelly-green" : "text-white"}`}
              >
                {score}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Final Actions */}
      <div className="mt-auto space-y-4">
        <button
          onClick={onFinalize}
          disabled={isSubmitting}
          className="w-full bg-kelly-green text-dark-bg py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(76,187,23,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trophy size={20} />{" "}
          {isSubmitting ? "SUBMITTING..." : "SUBMIT TO LEADERBOARD"}
        </button>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 py-4 rounded-xl font-bold bg-slate-800 text-slate-300 text-sm hover:bg-slate-700"
          >
            <Share2 size={16} /> SHARE
          </button>
          <button
            onClick={handleDiscardClick}
            className="flex items-center justify-center gap-2 py-4 rounded-xl font-bold border border-red-900/30 text-red-500/70 text-sm hover:bg-red-950/20"
          >
            <RotateCcw size={16} /> DISCARD
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
            onClose={cancelDiscard}
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
                    cannot be undone and your score will not be saved.
                  </Dialog.Description>

                  <div className="flex gap-4">
                    <button
                      onClick={cancelDiscard}
                      className="flex-1 py-3 rounded-xl font-bold bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 transition-colors"
                    >
                      CANCEL
                    </button>
                    <button
                      onClick={confirmDiscard}
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

export default RoundSummary;
