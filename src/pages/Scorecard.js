import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import ScoreEntry from '../components/ScoreEntry';

const ScorecardPage = () => {
  const { roundId } = useParams();
  const navigate = useNavigate();
  const [currentHole, setCurrentHole] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRound = async () => {
      try {
        const roundRef = doc(db, 'putting_league_rounds', roundId);
        const roundSnap = await getDoc(roundRef);

        if (roundSnap.exists()) {
          const data = roundSnap.data();
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

  const handleSaveHole = async (holeScore) => {
    try {
      const roundRef = doc(db, 'putting_league_rounds', roundId);

      await updateDoc(roundRef, {
        [`scores.${currentHole}`]: holeScore,
        current_hole: currentHole + 1
      });

      if (currentHole < 9) { // Assuming a 9-hole course based on the snippet
        setCurrentHole(prev => prev + 1);
      } else {
        // Handle round completion, e.g., navigate back to dashboard
        navigate('/');
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
