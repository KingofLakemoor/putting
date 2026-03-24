import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Calendar, MapPin, Activity, History as HistoryIcon, Medal } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getScoresForPlayer, getRounds, getCourses, getScores, getPlayers } from '../db';

const History = () => {
  const { currentUser } = useAuth() || { currentUser: { uid: 'test-user-id' } }; // Fallback for TestApp if needed
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState({
    rounds: [],
    personalBests: [],
    stats: {
      totalRounds: 0,
      averageScore: '--'
    }
  });

  useEffect(() => {
    const fetchHistoryData = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        // Fetch necessary data
        // Check for test mock data
        let playerScores, allRounds, courses, allScores;
        if (window.fakeDbData) {
            playerScores = window.fakeDbData.scores;
            allRounds = window.fakeDbData.rounds;
            courses = window.fakeDbData.courses;
            allScores = window.fakeDbData.allScores;
        } else {
            [playerScores, allRounds, courses, allScores] = await Promise.all([
              getScoresForPlayer(currentUser.uid),
              getRounds(),
              getCourses(),
              getScores()
            ]);
        }

        // Process data
        processData(playerScores, allRounds, courses, allScores);

      } catch (error) {
        console.error("Error fetching history data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoryData();
  }, [currentUser]);

  const processData = (playerScores, allRounds, courses, allScores) => {
    // 1. Map Course data
    const courseMap = {};
    for (const course of courses) {
      courseMap[course.course_id] = course;
    }

    // 2. Map Round Data
    const roundMap = {};
    for (const round of allRounds) {
      roundMap[round.round_id] = round;
    }

    // 3. Process Player Scores into Round History
    const historyList = [];
    const pbMap = {}; // course_id -> min_score
    let totalScoreAll = 0;
    let totalHolesAll = 0;

    for (const score of playerScores) {
      const parsedScore = parseInt(score.score, 10);
      if (isNaN(parsedScore)) continue;

      const round = roundMap[score.round_id];
      if (!round) continue; // Orphan score, skip

      const courseId = round.course_id;
      const course = courseId ? courseMap[courseId] : null;
      const courseName = course ? course.name : round.location || "Unknown Course";
      const totalHoles = course && course.holes ? course.holes.length : 18; // Default 18

      // Personal Best tracking
      if (courseId) {
          if (!pbMap[courseId]) {
              pbMap[courseId] = { score: parsedScore, courseName, date: round.date };
          } else if (parsedScore < pbMap[courseId].score) {
              pbMap[courseId] = { score: parsedScore, courseName, date: round.date };
          }
      }

      // Ranking calculation
      // Get all scores for this round
      const roundScores = allScores.filter(s => s.round_id === round.round_id);

      // Sort to find rank (ascending, lower is better)
      const sortedScores = [...roundScores].sort((a, b) => parseInt(a.score, 10) - parseInt(b.score, 10));

      // Find player's rank
      // Index + 1 because array is 0-indexed
      const playerRank = sortedScores.findIndex(s => s.player_id === currentUser.uid) + 1;
      const totalPlayers = sortedScores.length;

      historyList.push({
          id: score.score_id,
          roundId: round.round_id,
          date: round.date || score.timestamp,
          courseName,
          score: parsedScore,
          rank: playerRank > 0 ? playerRank : '-',
          totalPlayers,
          roundName: round.name || null
      });

      totalScoreAll += parsedScore;
      totalHolesAll += totalHoles;
    }

    // Sort history newest first
    historyList.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Convert PB map to array
    const pbArray = Object.keys(pbMap).map(id => ({
        courseId: id,
        ...pbMap[id]
    }));

    // Calculate Average
    let averageScore = '--';
    if (totalHolesAll > 0) {
        averageScore = ((totalScoreAll / totalHolesAll) * 18).toFixed(1);
    }

    setHistoryData({
        rounds: historyList,
        personalBests: pbArray,
        stats: {
            totalRounds: historyList.length,
            averageScore
        }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center">
        <p className="font-sports text-xl tracking-widest text-kelly-green animate-pulse">Loading History...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white p-4 md:p-8 font-sans">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-slate-800 pb-4 gap-4">
            <div>
              <h2 className="font-sports text-4xl uppercase tracking-tighter flex items-center gap-3">
                <HistoryIcon className="text-kelly-green" size={32} />
                Player History
              </h2>
              <p className="font-data text-[10px] text-slate-500 uppercase tracking-[0.2em]">Career Stats</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Stats Overview */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="order-1 md:order-none md:col-span-1 flex flex-col gap-6"
            >
                {/* Career Average */}
                <div className="bg-dark-surface border border-slate-700/50 rounded-2xl p-6 flex flex-col justify-between relative shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Activity size={16} className="text-kelly-green" /> Career Avg (18 Holes)
                    </h3>
                    <div className="text-5xl font-data font-black text-white mt-4">{historyData.stats.averageScore}</div>
                    <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-tighter">Total Rounds: {historyData.stats.totalRounds}</p>
                </div>

                {/* Personal Bests */}
                <div className="bg-dark-surface border border-slate-700/50 rounded-2xl p-6 relative shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                        <Trophy size={16} className="text-kelly-green" /> Personal Bests
                    </h3>

                    {historyData.personalBests.length === 0 ? (
                        <p className="text-slate-500 text-sm italic">No rounds played yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {historyData.personalBests.map(pb => (
                                <div key={pb.courseId} className="flex justify-between items-center border-b border-slate-800 pb-2 last:border-0 last:pb-0">
                                    <div>
                                        <p className="font-bold text-sm text-white uppercase">{pb.courseName}</p>
                                        <p className="text-[10px] text-slate-500 font-data">
                                            {pb.date ? new Date(pb.date).toLocaleDateString('en-US', { timeZone: 'UTC' }) : 'Unknown Date'}
                                        </p>
                                    </div>
                                    <div className="text-2xl font-data font-bold text-kelly-green">{pb.score}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Round History List */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="order-2 md:order-none md:col-span-2 bg-dark-surface border border-slate-700/50 rounded-2xl p-6 shadow-lg"
            >
                <h3 className="text-xl font-sports uppercase tracking-widest flex items-center gap-2 mb-6 text-white border-b border-slate-800 pb-4">
                    <Calendar size={20} className="text-kelly-green" /> Round History
                </h3>

                {historyData.rounds.length === 0 ? (
                    <div className="text-center text-slate-500 p-8 border border-dashed border-slate-800 rounded-xl bg-dark-bg/50">
                        No rounds found. Get out there and putt!
                    </div>
                ) : (
                    <div className="space-y-3">
                        {historyData.rounds.map((round, idx) => (
                            <div key={round.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-dark-bg/50 rounded-xl border border-slate-800 hover:border-kelly-green/50 transition-colors gap-4 sm:gap-0">
                                <div className="flex items-center gap-4">
                                    <div className="bg-slate-800/50 p-3 rounded-lg flex flex-col items-center justify-center min-w-[60px]">
                                        <span className="text-xs text-slate-400 font-data uppercase">{new Date(round.date).toLocaleString('en-US', { month: 'short' })}</span>
                                        <span className="text-lg font-bold text-white font-data">{new Date(round.date).toLocaleString('en-US', { day: '2-digit' })}</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-white uppercase text-sm sm:text-base">{round.roundName || round.courseName}</p>
                                        <p className="text-[10px] sm:text-xs text-slate-500 flex items-center gap-1 uppercase tracking-wider mt-1">
                                            <MapPin size={10} className="text-kelly-green" /> {round.courseName}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 border-t border-slate-800 pt-3 sm:border-0 sm:pt-0">
                                    <div className="text-center">
                                        <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Rank</p>
                                        <div className="flex items-center gap-1 justify-center">
                                            {round.rank === 1 && <Medal size={12} className="text-kelly-green" />}
                                            <p className={`text-lg font-data font-bold ${round.rank === 1 ? 'text-kelly-green' : 'text-slate-300'}`}>
                                                {round.rank}
                                            </p>
                                            <span className="text-[10px] text-slate-600 font-data">/{round.totalPlayers}</span>
                                        </div>
                                    </div>
                                    <div className="text-center sm:border-l border-slate-800 sm:pl-6">
                                        <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Score</p>
                                        <p className="text-2xl font-data font-black text-white">{round.score}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    </div>
  );
};

export default History;
