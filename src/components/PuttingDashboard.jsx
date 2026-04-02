import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, TrendingDown, Minus, PlusCircle, Activity, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Dialog } from '@headlessui/react';
import { useAuth } from '../contexts/AuthContext';
import { getActiveRoundForUser, createActiveRound, getRounds, getScoresForPlayer, getCourses, getScores, getPlayers, getSettings } from '../db';
import { formatDisplayName } from '../utils/format';

const PuttingDashboard = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dashboardStandings, setDashboardStandings] = useState([]);
  const [standingsTitle, setStandingsTitle] = useState('Current Standings');
  const [leaderboardLink, setLeaderboardLink] = useState('/leaderboard');
  const [activeRoundId, setActiveRoundId] = useState(null);
  const [activeEventRounds, setActiveEventRounds] = useState([]);
  const [myAvg, setMyAvg] = useState('--');
  const [avgTrend, setAvgTrend] = useState(null);
  const [trendIcon, setTrendIcon] = useState(null);
  const [trendColor, setTrendColor] = useState('text-slate-500');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (currentUser) {
        try {
          const round = await getActiveRoundForUser(currentUser.uid);
          if (round) {
            setActiveRoundId(round.round_id);
          }
        } catch (error) {
          console.error("Error fetching active round:", error);
        }

        try {
          // Calculate My Avg
          const [scores, rounds, courses] = await Promise.all([
            getScoresForPlayer(currentUser.uid),
            getRounds(),
            getCourses()
          ]);

          if (scores.length > 0) {
            const courseHolesMap = {};
            for (const course of courses) {
              courseHolesMap[course.course_id] = course.holes ? course.holes.length : 18; // default to 18 if no holes
            }

            const roundCourseMap = {};
            const roundMap = {};
            for (const r of rounds) {
               roundCourseMap[r.round_id] = r.course_id;
               roundMap[r.round_id] = r;
            }

            const now = Date.now();
            const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

            let totalScore = 0;
            let totalHoles = 0;
            let previousTotalScore = 0;
            let previousTotalHoles = 0;

            for (const score of scores) {
              const parsedScore = parseInt(score.score, 10);
              if (isNaN(parsedScore)) continue;

              const courseId = roundCourseMap[score.round_id];
              // Default to 18 holes if course not found (e.g., deleted course or casual round without course_id linked properly)
              const holes = courseId && courseHolesMap[courseId] ? courseHolesMap[courseId] : 18;

              totalScore += parsedScore;
              totalHoles += holes;

              // Check if score is older than 7 days
              // We'll use the score's timestamp or the round's date
              const roundObj = roundMap[score.round_id];
              const scoreDate = score.timestamp ? new Date(score.timestamp).getTime() : (roundObj && roundObj.date ? new Date(roundObj.date).getTime() : 0);

              if (scoreDate && scoreDate <= sevenDaysAgo) {
                 previousTotalScore += parsedScore;
                 previousTotalHoles += holes;
              }
            }

            if (totalHoles > 0) {
               const currentAvg = (totalScore / totalHoles) * 18;
               setMyAvg(currentAvg.toFixed(1));

               if (previousTotalHoles > 0) {
                  const previousAvg = (previousTotalScore / previousTotalHoles) * 18;
                  const diff = currentAvg - previousAvg;

                  if (Math.abs(diff) < 0.1) {
                      setAvgTrend('stable');
                      setTrendIcon(<Minus size={14} />);
                      setTrendColor('text-slate-500');
                  } else if (diff > 0) {
                      setAvgTrend(`+${Math.abs(diff).toFixed(1)} from last week`);
                      setTrendIcon(<TrendingDown size={14} />);
                      setTrendColor('text-red-500'); // Higher is worse in golf
                  } else {
                      setAvgTrend(`${diff.toFixed(1)} from last week`);
                      setTrendIcon(<TrendingUp size={14} />);
                      setTrendColor('text-kelly-green'); // Lower is better
                  }
               }
            }
          }
        } catch (error) {
           console.error("Error calculating average:", error);
        }
      }

      try {
        const rounds = await getRounds();
        const activeEvents = rounds.filter(r => (r.status || '').toLowerCase() === 'active' && !r.player_id && !r.event_round_id);
        setActiveEventRounds(activeEvents);

        // Fetch standings data
        const scores = await getScores();
        const players = await getPlayers();
        const settings = await getSettings();
        const courses = await getCourses();

        // Check for today's date
        // Note: round dates are typically stored as 'YYYY-MM-DD' local time
        // Constructing today's date in 'YYYY-MM-DD' format (accounting for local timezone)
        const today = new Date();
        const tzOffset = today.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(Date.now() - tzOffset)).toISOString().slice(0, 10);

        let roundsForStandings = rounds.filter(r => r.date === localISOTime);

        if (roundsForStandings.length > 0) {
           setStandingsTitle(`Today's Standings`);
           setLeaderboardLink('/leaderboard');
        } else if (settings.live_season) {
           roundsForStandings = rounds.filter(r => r.season === settings.live_season);
           setStandingsTitle(`${settings.live_season} Standings`);
           setLeaderboardLink('/leaderboard');
        } else {
           roundsForStandings = rounds; // Fallback to all rounds
           setStandingsTitle(`Global Standings`);
           setLeaderboardLink('/leaderboard');
        }

        const validRoundIds = roundsForStandings.map(r => r.round_id);
        const filteredScores = scores.filter(s => validRoundIds.includes(s.round_id));

        const playersMap = new Map();
        for (const p of players) {
          if (p.uid) playersMap.set(p.uid, p);
          if (p.player_id) playersMap.set(p.player_id, p);
        }

        const coursesMap = new Map();
        courses.forEach(c => {
           if (c.course_id) {
               coursesMap.set(c.course_id, {
                   ...c,
                   _computedTotalPar: Array.isArray(c.holes) ? c.holes.reduce((sum, h) => sum + (h.par || 2), 0) : 36,
                   _computedTotalHoles: Array.isArray(c.holes) ? c.holes.length : 18
               });
           }
        });

        const roundsMap = new Map();
        roundsForStandings.forEach(r => {
           if (r.round_id) roundsMap.set(r.round_id, r);
        });

        const scoresByPlayerId = {};
        for (const score of filteredScores) {
          const player = playersMap.get(score.player_id);
          const targetId = player ? player.player_id : score.player_id;

          if (!scoresByPlayerId[targetId]) {
            scoresByPlayerId[targetId] = [];
          }
          scoresByPlayerId[targetId].push(score);
        }

        const playerStats = players.map(player => {
          const playerScores = scoresByPlayerId[player.player_id] || [];
          let totalScore = 0;
          let totalPar = 0;
          let totalHoles = 0;
          for (const s of playerScores) {
            const parsed = parseInt(s.score, 10);
            if (!isNaN(parsed)) {
              totalScore += parsed;

              const round = roundsMap.get(s.round_id);
              let parForRound = 36;
              let holesForRound = 18;

              if (round && round.course_id) {
                 const course = coursesMap.get(round.course_id);
                 if (course) {
                    parForRound = course._computedTotalPar;
                    holesForRound = course._computedTotalHoles;
                 }
              }

              totalPar += parForRound;
              totalHoles += holesForRound;
            }
          }

          const relativeScore = totalScore - totalPar;

          return {
            ...player,
            name: formatDisplayName(player.name, players),
            totalScore,
            relativeScore,
            roundsPlayed: playerScores.length
          };
        });

        const activePlayers = playerStats.filter(p => p.roundsPlayed > 0);
        activePlayers.sort((a, b) => a.relativeScore - b.relativeScore);

        setDashboardStandings(activePlayers);

      } catch (error) {
        console.error("Error fetching event rounds:", error);
      }
    };
    fetchData();
  }, [currentUser]);

  const handleStartRound = async () => {
    try {
      if (activeRoundId) {
        navigate(`/scorecard/${activeRoundId}`);
      } else {
        setIsOpen(true);
        setError(null);
      }
    } catch (error) {
      console.error("Error starting round:", error);
    }
  };


  const handleSelectEventRound = async (eventRound) => {
    try {
      if (activeRoundId) {
        setError("You already have an active round. Please complete or discard it before starting a new one.");
        setTimeout(() => setError(null), 5000);
        return;
      }

      if (eventRound.score_limit) {
         // Check how many scores they've submitted for this event
         const historicalScores = await getScoresForPlayer(currentUser.uid);
         // Filter for this event round
         const scoresForEvent = historicalScores.filter(s => s.round_id === eventRound.round_id);
         if (scoresForEvent.length >= eventRound.score_limit) {
            setError(`You have reached the limit of ${eventRound.score_limit} score(s) for this event.`);
            // Clear error after a few seconds
            setTimeout(() => setError(null), 5000);
            return;
         }
      }

      setIsOpen(false);
      setError(null);
      const userName = currentUser.displayName || currentUser.email;
      const newRound = await createActiveRound(currentUser.uid, userName, eventRound.round_id, eventRound.name, eventRound.course_id);
      navigate(`/scorecard/${newRound.round_id}`);
    } catch (error) {
      console.error("Error creating round from event:", error);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white p-4 md:p-8 font-sans">
      {/* Header Area */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-sports text-4xl tracking-wide uppercase">Club 602</h1>
          <p className="text-slate-400 text-sm font-data">LEAGUE MANAGEMENT v2.0</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-kelly-green rounded-full animate-ping" />
          <span className="text-xs uppercase font-bold tracking-widest text-kelly-green">Live Session</span>
        </div>
      </header>

      {/* BENTO GRID START */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[180px]">

        {/* TOP LEFT: LIVE LEADERBOARD (Large) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="order-2 row-span-3 md:order-none md:col-span-2 md:row-span-3 bg-dark-surface border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden group flex flex-col"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="flex items-center gap-2 font-sports text-2xl">
              <Trophy className="text-kelly-green" size={24} />
              {standingsTitle}
            </h2>
            <Link to={leaderboardLink} className="text-xs font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-wider">VIEW ALL</Link>
          </div>

          <div className="space-y-3 flex-1">
            {dashboardStandings.slice(0, 5).map((player, index) => {
              const rank = index + 1;
              return (
                <div key={player.player_id} className="flex items-center justify-between p-4 bg-dark-bg/50 rounded-xl border-l-4 border-kelly-green group-hover:translate-x-1 transition-transform">
                  <div className="flex items-center gap-4">
                    <span className="font-data font-black text-2xl italic text-slate-600">0{rank}</span>
                    <div>
                      <p className="font-bold text-lg">{player.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Rounds: {player.roundsPlayed}</p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="text-center min-w-[60px]">
                      <p className="text-[9px] text-slate-500 uppercase">Tot</p>
                      <p className={`text-2xl font-data font-bold ${
                        player.relativeScore > 0 ? 'text-red-500' :
                        player.relativeScore < 0 ? 'text-kelly-green' :
                        'text-slate-300'
                      }`}>
                        {player.relativeScore > 0 ? `+${player.relativeScore}` :
                         player.relativeScore === 0 ? 'E' :
                         player.relativeScore}
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                      <TrendingUp size={16} className="text-kelly-green mb-1" />
                      <span className="text-[9px] text-slate-500">POS</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {dashboardStandings.length === 0 && (
              <p className="text-slate-400 text-sm italic">No standings available yet.</p>
            )}
          </div>
        </motion.div>

        {/* TOP RIGHT: QUICK ACTION (Small Square) */}
        <motion.button
          whileHover={{ scale: 0.98 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleStartRound}
          className="order-1 md:order-none bg-kelly-green text-dark-bg rounded-2xl flex flex-col items-center justify-center gap-3 font-sports text-3xl group p-4 text-center"
        >
          <PlusCircle size={48} className="group-hover:rotate-90 transition-transform duration-300" />
          {activeRoundId ? "RESUME ROUND" : "START ROUND"}
        </motion.button>

        {/* Start Round Modal */}
        <AnimatePresence>
          {isOpen && (
            <Dialog
              static
              as={motion.div}
              open={isOpen}
              onClose={() => { setIsOpen(false); setError(null); }}
              className="relative z-50"
            >
              {/* Backdrop */}
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
                    className="w-full max-w-md bg-dark-surface border border-slate-700/50 rounded-2xl p-6 text-white shadow-xl"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <Dialog.Title className="font-sports text-2xl text-kelly-green tracking-wide">
                        Select a Round
                      </Dialog.Title>
                      <button
                        onClick={() => setIsOpen(false)}
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        <X size={24} />
                      </button>
                    </div>

                    {error && (
                      <div className="bg-red-500/10 text-red-500 p-3 rounded-xl text-xs font-bold uppercase tracking-wider mb-4">
                        {error}
                      </div>
                    )}
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                      {activeEventRounds.length === 0 ? (
                        <p className="text-slate-400 text-sm">No active rounds available right now.</p>
                      ) : (
                        activeEventRounds.map((round) => {
                          let dateStr = '';
                          if (round.date) {
                            const d = new Date(round.date);
                            if (!isNaN(d.getTime())) {
                              dateStr = d.toLocaleDateString('en-US', { timeZone: 'UTC' });
                            }
                          }

                          return (
                            <button
                              key={round.round_id}
                              onClick={() => handleSelectEventRound(round)}
                              className="w-full text-left p-4 bg-dark-bg/50 border border-slate-700 hover:border-kelly-green/50 hover:bg-slate-800/50 rounded-xl transition-all group flex justify-between items-center"
                            >
                              <div>
                                <h3 className="font-bold text-lg group-hover:text-kelly-green transition-colors">
                                  {round.name || 'Round'}
                                </h3>
                                <p className="text-xs text-slate-400">
                                  {dateStr ? `${dateStr} • ${round.location}` : round.location}
                                </p>
                              </div>
                              <PlusCircle className="text-slate-500 group-hover:text-kelly-green transition-colors" size={20} />
                            </button>
                          );
                        })
                      )}
                    </div>
                  </Dialog.Panel>
                </div>
              </div>
            </Dialog>
          )}
        </AnimatePresence>

        {/* ADVERTISEMENT (Small Square) */}
        <motion.a
          href="https://www.club602.com/merch/p/april-15th-may-20th-putting-league-putting-world"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 0.98 }}
          whileTap={{ scale: 0.95 }}
          className="order-3 md:order-none bg-dark-surface border border-slate-700/50 rounded-2xl relative overflow-hidden group flex flex-col items-center justify-center text-center p-4 min-h-[180px]"
        >
          <img
            src="/putting-league-ad-final.jpg"
            alt="Upcoming Putting League"
            className="absolute inset-0 w-full h-full object-cover opacity-100 group-hover:opacity-80 transition-opacity duration-300"
          />
        </motion.a>

        {/* MIDDLE RIGHT: RECENT PERFORMANCE (Small Square) */}
        <div className="order-4 md:order-none bg-dark-surface border border-slate-700/50 rounded-2xl p-6 flex flex-col justify-between relative">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">My Avg</h3>
          <div className="text-5xl font-data font-black text-white">{myAvg}</div>
          {avgTrend && (
            <div className={`${trendColor} text-xs flex items-center gap-1 mt-2`}>
              {trendIcon} {avgTrend}
            </div>
          )}
          <Link to="/history" className="absolute bottom-6 right-6 text-[10px] text-slate-500 hover:text-white transition-colors uppercase font-bold tracking-widest">
            More Stats
          </Link>
        </div>

        {/* BOTTOM FULL: ACTIVE ROUNDS / REPORTING (Horizontal) */}
        <div className="order-5 md:order-none md:col-span-3 bg-dark-surface border border-slate-700/50 rounded-2xl p-6">
           {error && (
              <div className="bg-red-500/10 text-red-500 p-3 rounded-xl text-xs font-bold uppercase tracking-wider mb-4">
                {error}
              </div>
           )}
           <div className="flex items-center gap-2 mb-4">
              <Activity size={18} className="text-kelly-green" />
              <h2 className="font-sports text-xl uppercase">Report Scores</h2>
           </div>
           {activeEventRounds.length === 0 ? (
             <p className="text-slate-400">
               Have an idea for a putting league? Let Club 602 know on <a href="https://www.instagram.com/club_602/" className="text-kelly-green hover:underline">Instagram</a>.
             </p>
           ) : (
             <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                {activeEventRounds.map(round => {
                  let dateStr = '';
                  if (round.date) {
                    const d = new Date(round.date);
                    if (!isNaN(d.getTime())) {
                      dateStr = d.toLocaleDateString('en-US', { timeZone: 'UTC' });
                    }
                  }

                  return (
                    <div key={round.round_id} className="min-w-[280px] bg-dark-bg p-4 rounded-xl border border-slate-800 flex justify-between items-center shrink-0">
                      <div>
                        <p className="font-bold">{round.name ? round.name : 'Round'}</p>
                        <p className="text-xs text-slate-500">{dateStr ? `${dateStr} - ${round.location}` : round.location}</p>
                      </div>
                      <button onClick={() => handleSelectEventRound(round)} className="bg-slate-800 px-4 py-2 rounded-lg text-xs font-bold hover:bg-kelly-green hover:text-dark-bg transition-colors">
                        SCORE
                      </button>
                    </div>
                  );
                })}
             </div>
           )}
        </div>

      </div>
    </div>
  );
};

export default PuttingDashboard;
