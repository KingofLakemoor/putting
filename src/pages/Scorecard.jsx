import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import ScoreEntry from '../components/ScoreEntry';
import RoundSummary from '../components/RoundSummary';
import { getScoresForPlayer, updateRoundStatus, addScore, deleteRound, getPlayers, getScoresForRound, getCourse, getRound, getActualPlayerId, getActiveRoundForUser } from '../db';
import { useAuth } from '../contexts/AuthContext';

const ScorecardPage = () => {
  const { roundId } = useParams();
  const navigate = useNavigate();
  const [currentHole, setCurrentHole] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRoundComplete, setIsRoundComplete] = useState(false);
  const [roundData, setRoundData] = useState(null);
  const [courseData, setCourseData] = useState(null);
  const [isPB, setIsPB] = useState(false);
  const [players, setPlayers] = useState([]);
  const { currentUser } = useAuth();
  const [currentPlayerName, setCurrentPlayerName] = useState("You");
  const saveTimeoutRef = useRef(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchRoundAndPlayers = async () => {
      try {
        const roundRef = doc(db, 'putting_league_rounds', roundId);
        const roundSnap = await getDoc(roundRef);

        if (roundSnap.exists()) {
          const data = roundSnap.data();
          setRoundData(data);
          if (data.current_hole) {
            setCurrentHole(data.current_hole);
          }

          let courseIdToFetch = data.course_id;
          if (!courseIdToFetch && data.event_round_id) {
            const eventRound = await getRound(data.event_round_id);
            if (eventRound) {
              courseIdToFetch = eventRound.course_id;
            }
          }

          if (courseIdToFetch) {
            const course = await getCourse(courseIdToFetch);
            if (course) {
              setCourseData(course);
            }
          }
        }

        const allPlayers = await getPlayers();
        if (currentUser) {
          setPlayers(allPlayers.filter(p => p.player_id !== currentUser.uid && p.uid !== currentUser.uid));
          const actualId = await getActualPlayerId(currentUser.uid);
          const currentPlayerObj = allPlayers.find(p => p.player_id === actualId || p.uid === currentUser.uid);
          if (currentPlayerObj) {
            setCurrentPlayerName(currentPlayerObj.name);
          }
        } else {
          setPlayers(allPlayers);
        }

      } catch (error) {
        console.error("Error fetching round data or players:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoundAndPlayers();
  }, [roundId, currentUser]);

  const handleDiscard = async () => {
    try {
      await deleteRound(roundId);
      navigate('/');
    } catch (error) {
      console.error("Error discarding round:", error);
    }
  };

  const handleFinalize = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (currentUser && roundData) {
        await updateRoundStatus(roundId, 'completed');

        const currentTotal = Object.values(roundData.scores || {}).reduce((a, b) => a + b, 0);
        const eventRoundId = roundData.event_round_id || roundId;

        const actualId = await getActualPlayerId(currentUser.uid);

        await addScore({
          player_id: actualId,
          round_id: eventRoundId,
          score: currentTotal
        });

        let skipNavigation = false;
        if (roundData.opponent_id) {
          const opponentTotal = Object.values(roundData.opponent_scores || {}).reduce((a, b) => a + b, 0);
          const existingScores = await getScoresForRound(eventRoundId);
          if (existingScores.some(s => s.player_id === roundData.opponent_id)) {
            setError("Opponent was already scored and their previous score will not be overwritten.");
            skipNavigation = true;
            setTimeout(() => navigate('/'), 3000);
          } else {
            await addScore({
              player_id: roundData.opponent_id,
              round_id: eventRoundId,
              score: opponentTotal
            });
          }
        }

        if (!skipNavigation) {
          setError(null);
          navigate('/');
        }
      }
    } catch (error) {
      console.error("Error finalizing round:", error);
      setIsSubmitting(false);
    }
  };

  const handleSelectOpponent = async (opponentId) => {
    try {
      const activeRound = await getActiveRoundForUser(opponentId);
      if (activeRound) {
        setError("This player already has an active round.");
        setTimeout(() => setError(null), 5000);
        return;
      }

      const roundRef = doc(db, 'putting_league_rounds', roundId);
      await updateDoc(roundRef, {
        opponent_id: opponentId,
        opponent_scores: {}
      });
      setRoundData(prev => ({ ...prev, opponent_id: opponentId, opponent_scores: {} }));
    } catch (error) {
      console.error("Error selecting opponent:", error);
      setError("Failed to select opponent.");
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleScoreChange = (holeScore, opponentHoleScore) => {
    setRoundData(prev => {
      const hasOpponent = prev.opponent_id;
      return {
        ...prev,
        scores: { ...prev.scores, [currentHole]: holeScore },
        opponent_scores: hasOpponent && opponentHoleScore !== undefined ? { ...(prev.opponent_scores || {}), [currentHole]: opponentHoleScore } : prev.opponent_scores
      };
    });

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const roundRef = doc(db, 'putting_league_rounds', roundId);
        const updateData = {
          [`scores.${currentHole}`]: holeScore,
        };

        if (roundData?.opponent_id && opponentHoleScore !== undefined) {
          updateData[`opponent_scores.${currentHole}`] = opponentHoleScore;
        }

        await updateDoc(roundRef, updateData);
      } catch (error) {
        console.error("Error saving score in background:", error);
      }
    }, 500);
  };

  const handleGoToHole = async (holeIndex) => {
    if (holeIndex === currentHole) return;
    try {
      const roundRef = doc(db, 'putting_league_rounds', roundId);
      updateDoc(roundRef, { current_hole: holeIndex }).catch(e => console.error(e));
      setCurrentHole(holeIndex);
    } catch (error) {
      console.error("Error navigating to hole:", error);
    }
  };

  const handleAdvanceHole = async () => {
    try {
      const totalHoles = courseData?.holes?.length || 9;
      const roundRef = doc(db, 'putting_league_rounds', roundId);

      // Update the current hole marker in DB if we're advancing
      if (currentHole < totalHoles) {
        await updateDoc(roundRef, { current_hole: currentHole + 1 });
        setCurrentHole(prev => prev + 1);
      } else {
        // Final hole completed
        const missingHoles = [];
        for (let i = 1; i <= totalHoles; i++) {
          const userScore = roundData?.scores?.[i];
          const opponentScore = roundData?.opponent_id ? roundData?.opponent_scores?.[i] : null;

          const userMissing = userScore === undefined || userScore === null;
          const opponentMissing = roundData?.opponent_id && (opponentScore === undefined || opponentScore === null);

          if (userMissing || opponentMissing) {
            missingHoles.push(i);
          }
        }

        if (missingHoles.length > 0) {
          setError(`Cannot finish round. Missing scores on holes: ${missingHoles.join(', ')}`);
          setTimeout(() => setError(null), 5000);
          return;
        }

        await updateDoc(roundRef, { current_hole: currentHole });
        setIsRoundComplete(true);
        if (currentUser && roundData) {
          const historicalScores = await getScoresForPlayer(currentUser.uid);
          const currentTotal = Object.values(roundData.scores || {}).reduce((a, b) => a + b, 0);

          if (historicalScores && historicalScores.length > 0) {
            const minScore = Math.min(...historicalScores.map(s => s.score));
            if (currentTotal < minScore) {
              setIsPB(true);
            }
          } else {
            setIsPB(true);
          }
        }
      }
    } catch (error) {
       console.error("Error advancing hole:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center">
        <p className="font-sports text-xl tracking-widest text-kelly-green animate-pulse">Loading...</p>
      </div>
    );
  }

  if (isRoundComplete && roundData) {
    return (
      <div className="flex flex-col">
        {error && (
          <div className="bg-red-500/10 text-red-500 p-3 m-4 rounded-xl text-xs font-bold uppercase tracking-wider text-center">
            {error}
          </div>
        )}
        <RoundSummary
          roundData={roundData}
          onFinalize={handleFinalize}
          onDiscard={handleDiscard}
          isPB={isPB}
          isSubmitting={isSubmitting}
        />
      </div>
    );
  }

  const roundName = roundData?.event_round_name || roundData?.name || "Casual Round";
  const totalHoles = courseData?.holes?.length || 9;

  // Find par for the current hole
  const holesMap = new Map();
  if (courseData?.holes) {
    courseData.holes.forEach(h => holesMap.set(h.hole, h));
  }
  const currentHoleData = holesMap.get(currentHole);
  const currentPar = currentHoleData ? currentHoleData.par : 3;

  // Calculate totals and relative scores
  let userStrokes = 0;
  let userRelative = 0;
  let opponentStrokes = 0;
  let opponentRelative = 0;

  if (roundData && courseData?.holes) {
    courseData.holes.forEach(hole => {
      const hScore = roundData.scores?.[hole.hole];
      if (hScore !== undefined && hScore !== null) {
        userStrokes += hScore;
        userRelative += (hScore - hole.par);
      }

      if (roundData.opponent_id) {
        const oppHScore = roundData.opponent_scores?.[hole.hole];
        if (oppHScore !== undefined && oppHScore !== null) {
          opponentStrokes += oppHScore;
          opponentRelative += (oppHScore - hole.par);
        }
      }
    });
  }

  return (
    <ScoreEntry
      holeNumber={currentHole}
      totalHoles={totalHoles}
      par={currentPar}
      onScoreChange={handleScoreChange}
      onAdvance={handleAdvanceHole}
      onCancel={() => navigate('/')}
      onDiscard={handleDiscard}
      onNext={() => {
        if (currentHole < totalHoles) {
          // ensure doc updates before moving
          const roundRef = doc(db, 'putting_league_rounds', roundId);
          updateDoc(roundRef, { current_hole: currentHole + 1 }).catch(e => console.error(e));
          setCurrentHole(prev => prev + 1);
        }
      }}
      onPrev={() => {
        if (currentHole > 1) {
          const roundRef = doc(db, 'putting_league_rounds', roundId);
          updateDoc(roundRef, { current_hole: currentHole - 1 }).catch(e => console.error(e));
          setCurrentHole(prev => prev - 1);
        }
      }}
      scoreValue={roundData?.scores?.[currentHole]}
      opponentScoreValue={roundData?.opponent_scores?.[currentHole]}
      allScores={roundData?.scores || {}}
      allOpponentScores={roundData?.opponent_scores || {}}
      holesData={courseData?.holes || []}
      onGoToHole={handleGoToHole}
      players={players}
      opponentId={roundData?.opponent_id}
      onSelectOpponent={handleSelectOpponent}
      roundName={roundName}
      error={error}
      playerName={currentPlayerName}
      userStrokes={userStrokes}
      userRelative={userRelative}
      opponentStrokes={opponentStrokes}
      opponentRelative={opponentRelative}
    />
  );
};

export default ScorecardPage;
