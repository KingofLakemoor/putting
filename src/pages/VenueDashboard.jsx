import React, { useState, useEffect, useMemo } from "react";
import { Activity } from "lucide-react";
import PGALeaderboard from "../components/PGALeaderboard";

const VenueDashboard = () => {
  return (
    <div className="min-h-screen bg-dark-bg text-white font-sans p-8 flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <div>
          <h1 className="font-sports text-6xl tracking-wide uppercase text-white">
            Club 602
          </h1>
          <p className="text-kelly-green text-xl font-data tracking-widest uppercase">
            Live Event Dashboard
          </p>
        </div>
        <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-xl">
          <div className="h-4 w-4 bg-kelly-green rounded-full animate-pulse" />
          <span className="text-lg uppercase font-bold tracking-widest text-slate-300">
            Live Broadcast
          </span>
        </div>
      </header>

      {/* Main Full-Width Container: PGA Leaderboard */}
      <div className="bg-dark-surface border border-slate-700/50 rounded-3xl p-8 flex flex-col flex-1">
        <div className="flex items-center gap-4 mb-8">
          <Activity className="text-kelly-green" size={32} />
          <h2 className="font-sports text-4xl uppercase">
            Expanded Leaderboard
          </h2>
        </div>

        <div className="flex-1 overflow-hidden rounded-xl border border-slate-700/50">
          {/* Render the full-width PGA Leaderboard */}
          <PGALeaderboard />
        </div>
      </div>
    </div>
  );
};

export default VenueDashboard;
