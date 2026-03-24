import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import ScoreEntry from '../components/ScoreEntry';
import RoundSummary from '../components/RoundSummary';
import { getScoresForPlayer, updateRoundStatus, addScore, deleteRound } from '../db';
import { useAuth } from '../contexts/AuthContext';

const ScorecardPage = () => {
  const { roundId } = useParams();
  const navigate = useNavigate();
  const [currentHole, setCurrentHole] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRoundComplete, setIsRoundComplete] = useState(false);
  const [roundData, setRoundData] = useState(null);
  const [isPB, setIsPB] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchRound = async () => {
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
      } catch (error) {
        console.error("Error fetching round data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRound();
  }, [roundId]);

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

        await addScore({
          player_id: currentUser.uid,
          round_id: roundId,
          score: currentTotal
        });

        navigate('/');
      }
    } catch (error) {
      console.error("Error finalizing round:", error);
    }
  };

  const handleSaveHole = async (holeScore) => {
    try {
      const roundRef = doc(db, 'putting_league_rounds', roundId);

      await updateDoc(roundRef, {
        [`scores.${currentHole}`]: holeScore,
        current_hole: currentHole + 1
      });

      setRoundData(prev => ({
        ...prev,
        scores: { ...prev.scores, [currentHole]: holeScore }
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
    />
  );
};

export default ScorecardPage;
