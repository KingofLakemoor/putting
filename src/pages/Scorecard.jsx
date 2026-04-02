import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import ScoreEntry from '../components/ScoreEntry';
import RoundSummary from '../components/RoundSummary';
import { getScoresForPlayer, updateRoundStatus, addScore, deleteRound, getPlayers, getScoresForRound, getCourse, getRound, getActualPlayerId } from '../db';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentUser } = useAuth();
  const saveTimeoutRef = useRef(null);
  const [error, setError] = useState(null);

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
          setPlayers(allPlayers.filter(p => p.player_id !== currentUser.uid));
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

    try {
      if (currentUser && roundData) {
        setIsSubmitting(true);
        setError(null);

        const actualId = await getActualPlayerId(currentUser.uid);
        const eventRoundId = roundData.event_round_id || roundId;
        const currentTotal = Object.values(roundData.scores || {}).reduce((a, b) => a + b, 0);

        // 1. Validation Checks
        let eventRoundTemplate = null;
        if (roundData.event_round_id) {
          eventRoundTemplate = await getRound(roundData.event_round_id);
        }

        // Check player limit
        if (eventRoundTemplate?.score_limit) {
          const historicalScores = await getScoresForPlayer(actualId);
          const scoresForEvent = historicalScores.filter(s => s.round_id === eventRoundId);
          if (scoresForEvent.length >= eventRoundTemplate.score_limit) {
            setError(`You have already reached the limit of ${eventRoundTemplate.score_limit} score(s) for this event.`);
            setIsSubmitting(false);
            return;
          }
        }

        // Check opponent validation if applicable
        let opponentScoreToSubmit = null;
        let opponentError = null;
        if (roundData.opponent_id) {
          const existingScores = await getScoresForRound(eventRoundId);
          if (existingScores.some(s => s.player_id === roundData.opponent_id)) {
            opponentError = "Opponent was already scored for this event and their score will not be overwritten.";
          } else if (eventRoundTemplate?.score_limit) {
            const opponentHistoricalScores = await getScoresForPlayer(roundData.opponent_id);
            const opponentScoresForEvent = opponentHistoricalScores.filter(s => s.round_id === eventRoundId);
            if (opponentScoresForEvent.length >= eventRoundTemplate.score_limit) {
              opponentError = `Opponent has already reached the limit of ${eventRoundTemplate.score_limit} score(s) for this event. Their score will not be submitted.`;
            }
          }

          if (!opponentError) {
            opponentScoreToSubmit = Object.values(roundData.opponent_scores || {}).reduce((a, b) => a + b, 0);
          } else {
            setError(opponentError);
          }
        }

        // 2. Execution (Idempotent)
        const submissionPromises = [
          updateRoundStatus(roundId, 'completed'),
          addScore({
            player_id: actualId,
            round_id: eventRoundId,
            score: currentTotal
          }, `score_${roundId}_${actualId}`)
        ];

        if (roundData.opponent_id && opponentScoreToSubmit !== null) {
          submissionPromises.push(
            addScore({
              player_id: roundData.opponent_id,
              round_id: eventRoundId,
              score: opponentScoreToSubmit
            }, `score_${roundId}_${roundData.opponent_id}`)
          );
        }

        await Promise.all(submissionPromises);
        navigate('/');
      }
    } catch (err) {
      console.error("Error finalizing round:", err);
      setError("An error occurred while submitting your score. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleSelectOpponent = async (opponentId) => {
    try {
      const roundRef = doc(db, 'putting_league_rounds', roundId);
      await updateDoc(roundRef, {
        opponent_id: opponentId,
        opponent_scores: {}
      });
      setRoundData(prev => ({ ...prev, opponent_id: opponentId, opponent_scores: {} }));
    } catch (error) {
      console.error("Error selecting opponent:", error);
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

  return (
    <ScoreEntry
      holeNumber={currentHole}
      totalHoles={totalHoles}
      par={currentPar}
      onScoreChange={handleScoreChange}
      onAdvance={handleAdvanceHole}
      onCancel={() => navigate('/')}
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
      players={players}
      opponentId={roundData?.opponent_id}
      onSelectOpponent={handleSelectOpponent}
      roundName={roundName}
    />
  );
};

export default ScorecardPage;
