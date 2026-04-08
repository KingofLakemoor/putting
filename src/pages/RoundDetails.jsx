import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, MapPin, Calendar, PlusCircle, Trophy, Medal, X, CheckCircle } from 'lucide-react';
import { getRound, getPlayers, getScoresForRound, addScore, deleteScore, updateRoundStatus, recalculateCupPointsForEvent, getRounds } from '../db';
import { formatDisplayName } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';

function RoundDetails() {
  const auth = useAuth();
  const currentUser = auth?.currentUser;
  const isAdminOrCoordinator = auth?.isAdmin || auth?.isCoordinator;

  const { id } = useParams();
  const [round, setRound] = useState(null);
  const [players, setPlayers] = useState([]);
  const [scores, setScores] = useState([]);
  const [error, setError] = useState(null);
  const [advancingPlayerIds, setAdvancingPlayerIds] = useState(null);

  // Form State
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [roundScore, setRoundScore] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      // Load round
      const currentRound = await getRound(id);
      setRound(currentRound);

      // Load players and scores
      if (currentRound) {
        setPlayers(await getPlayers());
        setScores(await getScoresForRound(id));

        // If this is a subsequent round in an event, figure out advancing players
        if (currentRound.event_id) {
          const match = currentRound.name?.match(/Round (\d+)/i);
          if (match) {
            const currentRoundNumber = parseInt(match[1], 10);
            if (currentRoundNumber > 1) {
              const allRounds = await getRounds();
              // Find the previous round in the same event
              const previousRoundNamePattern = new RegExp(`Round ${currentRoundNumber - 1}`, 'i');
              const previousRound = allRounds.find(r =>
                r.event_id === currentRound.event_id &&
                r.date === currentRound.date &&
                previousRoundNamePattern.test(r.name)
              );

              if (previousRound) {
                const prevScores = await getScoresForRound(previousRound.round_id);
                // Sort scores (lowest first)
                prevScores.sort((a, b) => a.score - b.score);

                let eligibleScores = prevScores;
                if (previousRound.cut_line) {
                   const cutLine = parseInt(previousRound.cut_line, 10);
                   if (!isNaN(cutLine)) {
                     // Get score at cut line to handle ties
                     if (prevScores.length > cutLine) {
                         const cutScore = prevScores[cutLine - 1].score;
                         eligibleScores = prevScores.filter(s => s.score <= cutScore);
                     }
                   }
                }

                const eligibleIds = new Set(eligibleScores.map(s => s.player_id));
                setAdvancingPlayerIds(eligibleIds);
              }
            }
          }
        }
      }
    };
    loadData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlayerId || roundScore === '') return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      if ((round.status || '').toLowerCase() !== 'active') {
        setError('This round is no longer active. Scores cannot be submitted.');
        setIsSubmitting(false);
        return;
      }

      // Check if player has reached the score limit for this round
      const limit = round.score_limit || 1;
      const existingScoresCount = scores.filter(s => s.player_id === selectedPlayerId).length;

      if (existingScoresCount >= limit) {
        setError(`This player already has reached the limit of ${limit} score(s) for this round.`);
        setIsSubmitting(false);
        return;
      }
      setError(null);

      const newScore = {
        player_id: selectedPlayerId,
        round_id: id,
        score: parseInt(roundScore)
      };

      const created = await addScore(newScore);
      setScores([...scores, created]);

      // Reset form
      setSelectedPlayerId('');
      setRoundScore('');
    } catch (error) {
      console.error("Error submitting score:", error);
      setError('Failed to submit score.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdrawPlayer = async (scoreId) => {
    if (window.confirm("Are you sure you want to withdraw this player? Their score will be deleted and they will receive a DNF.")) {
      await deleteScore(scoreId);
      setScores(scores.filter(s => s.score_id !== scoreId));
    }
  };

  const handleEndRound = async () => {
    if (window.confirm("Are you sure you want to end this round? No more scores can be entered.")) {
      await updateRoundStatus(id, 'Completed');

      // Update local state
      setRound(prev => ({ ...prev, status: 'Completed' }));

      // Calculate points when status is changed to completed, skip for Open formats
      if (round.round_format !== 'Open' && round.event_id) {
          // Note: recalculateCupPointsForEvent expects the event_round_id for scoring.
          // Assuming `id` is the template round id that serves as event_round_id for players.
          await recalculateCupPointsForEvent(id, round.is_signature);
      }
    }
  };

  if (!round) {
    return <div className="page-container">Loading round...</div>;
  }

  const playersMap = new Map();
  const playersByNameMap = new Map();
  players.forEach(p => {
      if (p.uid) playersMap.set(p.uid, p);
      if (p.player_id) playersMap.set(p.player_id, p);
      if (p.name) playersByNameMap.set(p.name.toLowerCase(), p);
  });

  // Map player info to scores for display
  const scoredPlayers = scores.map(score => {
    let player = playersMap.get(score.player_id);

    // Fallback: Link by player_name if the score belongs to the round's creator
    if (!player && round.player_id === score.player_id && round.player_name) {
       player = playersByNameMap.get(round.player_name.toLowerCase());
    }

    const fallbackName = (round.player_id === score.player_id && round.player_name) ? round.player_name : 'Unknown Player';

    return {
      ...score,
      playerName: formatDisplayName(player ? player.name : fallbackName, players),
    };
  }).sort((a, b) => {
    // Sort by score ascending (lower is better)
    return a.score - b.score;
  });

  // Filter available players based on score limit
  const limit = round.score_limit || 1;
  const playerScoresCount = {};
  scores.forEach(s => {
    if (s.player_id) {
      playerScoresCount[s.player_id] = (playerScoresCount[s.player_id] || 0) + 1;
    }
  });

  const availablePlayers = players.filter(p => {
    // If advancing players is defined, ONLY include players who made the cut/finished previous round
    if (advancingPlayerIds && !advancingPlayerIds.has(p.player_id)) {
        return false;
    }
    const count = Math.max(playerScoresCount[p.player_id] || 0, playerScoresCount[p.uid] || 0);
    return count < limit;
  });

  const dateObj = new Date(round.date);
  const dateStr = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('en-US', { timeZone: 'UTC' }) : 'Unknown Date';

  return (
    <div className="min-h-screen bg-dark-bg text-white p-4 md:p-8 font-sans">
      <Link to="/leaderboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm font-bold uppercase tracking-wider">
        <ChevronLeft size={16} /> Back to Leaderboard
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-slate-800 pb-6 gap-6">
        <div>
          <h2 className="font-sports text-4xl sm:text-5xl uppercase tracking-tighter text-white mb-2">
            {round.name || 'Round Details'}
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-slate-400 font-data text-xs uppercase tracking-widest">
            <span className="flex items-center gap-1"><Calendar size={14} className="text-kelly-green" /> {dateStr}</span>
            <span className="flex items-center gap-1"><MapPin size={14} className="text-kelly-green" /> {round.location}</span>
            <span className={`px-2 py-1 rounded font-bold text-[10px] ${(round.status || '').toLowerCase() === 'active' ? 'bg-kelly-green/20 text-kelly-green' : 'bg-slate-800 text-slate-300'}`}>
              {round.status}
            </span>
            {round.round_format && round.round_format !== 'Open' && (
              <span className="px-2 py-1 rounded font-bold text-[10px] bg-yellow-500/20 text-yellow-500">
                Format: {round.round_format}
              </span>
            )}
            {round.cut_line && (
              <span className="px-2 py-1 rounded font-bold text-[10px] bg-purple-500/20 text-purple-400">
                Cut Line: Top {round.cut_line}
              </span>
            )}
            {round.number_of_rounds && (
              <span className="px-2 py-1 rounded font-bold text-[10px] bg-blue-500/20 text-blue-400">
                {round.number_of_rounds} Rounds
              </span>
            )}
          </div>
        </div>

        {(round.status || '').toLowerCase() === 'active' && (
          <div className="flex gap-4 w-full md:w-auto flex-col sm:flex-row">
            <Link to={`/rounds/${id}/scorecard`} className="w-full sm:w-auto bg-kelly-green text-dark-bg py-3 px-6 rounded-xl font-bold uppercase tracking-wider hover:bg-green-500 transition-colors flex items-center justify-center gap-2">
              <PlusCircle size={18} /> Fill Scorecard
            </Link>
            {isAdminOrCoordinator && (
              <button
                onClick={handleEndRound}
                className="w-full sm:w-auto bg-red-500/20 text-red-500 py-3 px-6 rounded-xl font-bold uppercase tracking-wider hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} /> End Round
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h3 className="font-sports text-2xl uppercase tracking-widest text-slate-300 mb-6 flex items-center gap-2">
            <Trophy size={20} className="text-kelly-green" /> Round Leaderboard
          </h3>

          {scoredPlayers.length === 0 ? (
            <div className="text-center text-slate-500 p-12 border border-dashed border-slate-800 rounded-2xl bg-dark-surface/30">
              No scores submitted for this round yet.
            </div>
          ) : (
            <div className="space-y-3">
              {scoredPlayers.map((score, index) => {
                const rank = index + 1;
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={score.score_id}
                    className={`relative group flex items-center justify-between p-4 rounded-xl border transition-all duration-300
                      ${index === 0
                        ? 'bg-dark-surface border-slate-700 shadow-[0_0_15px_rgba(76,187,23,0.1)] border-l-4 border-l-kelly-green'
                        : 'bg-transparent border-slate-800 opacity-90 hover:opacity-100 hover:bg-dark-surface/50'
                      }`}
                  >
                    <div className="flex items-center gap-5">
                      <div className="relative">
                        <span className={`font-sports text-3xl italic tracking-tighter ${index === 0 ? 'text-white' : 'text-slate-600'}`}>
                          {rank < 10 ? `0${rank}` : rank}
                        </span>
                        {index === 0 && (
                          <Medal size={14} className="absolute -top-2 -right-2 text-kelly-green animate-pulse" />
                        )}
                      </div>
                      <p className={`font-bold text-lg uppercase tracking-tight ${index === 0 ? 'text-kelly-green' : 'text-white'}`}>
                        {score.playerName}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Score</p>
                        <p className={`text-2xl font-data font-black ${index === 0 ? 'text-kelly-green' : 'text-white'} ${score.status === 'DNF' ? 'text-red-500 text-xl' : ''}`}>
                          {score.status === 'DNF' ? 'DNF' : score.score}
                        </p>
                      </div>
                      {isAdminOrCoordinator && (round.status || '').toLowerCase() === 'active' && score.status !== 'DNF' && (
                        <button
                          onClick={() => handleWithdrawPlayer(score.score_id)}
                          className="ml-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-full transition-colors"
                          title="Withdraw Player (DNF)"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {(round.status || '').toLowerCase() === 'active' && (
          <div>
            <h3 className="font-sports text-2xl uppercase tracking-widest text-slate-300 mb-6 flex items-center gap-2">
              <PlusCircle size={20} className="text-kelly-green" /> Enter Score
            </h3>

            <div className="bg-dark-surface border border-slate-800 rounded-2xl p-6 shadow-xl">
              {availablePlayers.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">All players have scores for this round!</p>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="player">Select Player *</label>
                    <select
                      id="player"
                      value={selectedPlayerId}
                      onChange={(e) => setSelectedPlayerId(e.target.value)}
                      required
                      className="w-full bg-dark-bg border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-kelly-green focus:outline-none transition-colors appearance-none"
                    >
                      <option value="">-- Choose a player --</option>
                      {availablePlayers.map(player => (
                        <option key={player.player_id} value={player.player_id}>
                          {formatDisplayName(player.name, players)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="score">Total Score *</label>
                    <input
                      type="number"
                      id="score"
                      min="0"
                      value={roundScore}
                      onChange={(e) => setRoundScore(e.target.value)}
                      required
                      className="w-full bg-dark-bg border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-kelly-green focus:outline-none transition-colors font-data text-xl text-center"
                    />
                  </div>

                  <button type="submit" disabled={isSubmitting} className={`w-full py-4 rounded-xl font-bold uppercase tracking-wider transition-colors mt-2 ${isSubmitting ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-kelly-green text-dark-bg hover:bg-green-500'}`}>
                    {isSubmitting ? 'Submitting...' : 'Submit Score'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RoundDetails;
