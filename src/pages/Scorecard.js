import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import ScoreEntry from '../components/ScoreEntry';
import RoundSummary from '../components/RoundSummary';
import { getScoresForPlayer, updateRoundStatus, addScore, deleteRound, getPlayers, getScoresForRound } from '../db';
import { useAuth } from '../contexts/AuthContext';

const ScorecardPage = () => {
  const { roundId } = useParams();
  const navigate = useNavigate();
  const [currentHole, setCurrentHole] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRoundComplete, setIsRoundComplete] = useState(false);
  const [roundData, setRoundData] = useState(null);
  const [isPB, setIsPB] = useState(false);
  const [players, setPlayers] = useState([]);
  const { currentUser } = useAuth();

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
    try {
      if (currentUser && roundData) {
        await updateRoundStatus(roundId, 'completed');

        const currentTotal = Object.values(roundData.scores || {}).reduce((a, b) => a + b, 0);
        const eventRoundId = roundData.event_round_id || roundId;

        await addScore({
          player_id: currentUser.uid,
          round_id: eventRoundId,
          score: currentTotal
        });

        if (roundData.opponent_id) {
          const opponentTotal = Object.values(roundData.opponent_scores || {}).reduce((a, b) => a + b, 0);
          const existingScores = await getScoresForRound(eventRoundId);
          if (existingScores.some(s => s.player_id === roundData.opponent_id)) {
            alert("Opponent was already scored and their previous score will not be overwritten.");
          } else {
            await addScore({
              player_id: roundData.opponent_id,
              round_id: eventRoundId,
              score: opponentTotal
            });
          }
        }

        navigate('/');
      }
    } catch (error) {
      console.error("Error finalizing round:", error);
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

  const handleSaveHole = async (holeScore, opponentHoleScore) => {
    try {
      const roundRef = doc(db, 'putting_league_rounds', roundId);
      const updateData = {
        [`scores.${currentHole}`]: holeScore,
        current_hole: currentHole + 1
      };

      if (roundData.opponent_id && opponentHoleScore !== undefined) {
        updateData[`opponent_scores.${currentHole}`] = opponentHoleScore;
      }

      await updateDoc(roundRef, updateData);

      setRoundData(prev => ({
        ...prev,
        scores: { ...prev.scores, [currentHole]: holeScore },
        opponent_scores: roundData.opponent_id && opponentHoleScore !== undefined ? { ...(prev.opponent_scores || {}), [currentHole]: opponentHoleScore } : prev.opponent_scores
      }));

      if (currentHole < 9) { // Assuming a 9-hole course based on the snippet
        setCurrentHole(prev => prev + 1);
      } else {
        // Handle round completion
        setIsRoundComplete(true);
        if (currentUser) {
          const historicalScores = await getScoresForPlayer(currentUser.uid);
          const currentTotal = Object.values({ ...roundData.scores, [currentHole]: holeScore }).reduce((a, b) => a + b, 0);

          if (historicalScores && historicalScores.length > 0) {
            const minScore = Math.min(...historicalScores.map(s => s.score));
            if (currentTotal < minScore) {
              setIsPB(true);
            }
          } else {
            // First time playing, so technically it is their best score
            setIsPB(true);
          }
        }
      }
    } catch (error) {
      console.error("Error saving score:", error);
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
      <RoundSummary
        roundData={roundData}
        onFinalize={handleFinalize}
        onDiscard={handleDiscard}
        isPB={isPB}
      />
    );
  }

  const roundName = roundData?.event_round_name || roundData?.name || "Casual Round";

  return (
    <ScoreEntry
      holeNumber={currentHole}
      totalHoles={9}
      onSave={handleSaveHole}
      onCancel={() => navigate('/')}
      onNext={() => {
        if (currentHole < 9) setCurrentHole(prev => prev + 1);
      }}
      onPrev={() => {
        if (currentHole > 1) setCurrentHole(prev => prev - 1);
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
