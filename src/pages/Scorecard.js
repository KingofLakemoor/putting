import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPlayers, getRounds, addScore, getScoresForRound, getCourses } from '../db';

function Scorecard() {
  const { id } = useParams(); // round_id
  const navigate = useNavigate();

  const [round, setRound] = useState(null);
  const [players, setPlayers] = useState([]);
  const [course, setCourse] = useState(null);

  // Dropdown Selections
  const [playerId, setPlayerId] = useState('');
  const [opponentId, setOpponentId] = useState('');

  // Score state: Object with hole number as key
  const [playerScores, setPlayerScores] = useState({});
  const [opponentScores, setOpponentScores] = useState({});

  // View state
  const [isReviewing, setIsReviewing] = useState(false);
  const [currentHoleIndex, setCurrentHoleIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Computed totals
  const [playerTotal, setPlayerTotal] = useState(0);
  const [opponentTotal, setOpponentTotal] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      // Load round data
      const allRounds = await getRounds();
      const currentRound = allRounds.find(r => r.round_id === id);
      setRound(currentRound);

      // Load course data
      const allCourses = await getCourses();
      if (currentRound && currentRound.course_id) {
        setCourse(allCourses.find(c => c.course_id === currentRound.course_id));
      } else if (currentRound) {
        // Legacy fallback
        setCourse(allCourses.find(c => c.name === currentRound.location));
      }

      // Load all players
      const allPlayers = await getPlayers();
      setPlayers(allPlayers);

      // Load draft from localStorage if exists
      const draftKey = `scorecard_draft_${id}`;
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          if (parsed.playerId) setPlayerId(parsed.playerId);
          if (parsed.opponentId) setOpponentId(parsed.opponentId);
          if (parsed.playerScores) setPlayerScores(parsed.playerScores);
          if (parsed.opponentScores) setOpponentScores(parsed.opponentScores);
        } catch (e) {
          console.error("Failed to parse draft", e);
        }
      }
    };
    loadData();
  }, [id]);

  // Soft save
  useEffect(() => {
    const draftKey = `scorecard_draft_${id}`;
    const draft = {
      playerId,
      opponentId,
      playerScores,
      opponentScores
    };
    localStorage.setItem(draftKey, JSON.stringify(draft));
  }, [playerId, opponentId, playerScores, opponentScores, id]);

  const handleScoreChange = (hole, isPlayer, value) => {
    // Keep it as a string while editing to allow deleting cleanly
    const val = value;

    if (isPlayer) {
      setPlayerScores(prev => ({ ...prev, [hole]: val }));
    } else {
      setOpponentScores(prev => ({ ...prev, [hole]: val }));
    }
  };

  const calculateTotal = (scoresObj) => {
    return Object.values(scoresObj).reduce((sum, score) => {
      // Parse here so we can ignore empty strings or NaNs
      if (score === '' || score === null || score === undefined) return sum;
      const val = parseInt(score, 10);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  };

  const getParForHole = (holeNum) => {
    if (!course || !course.holes) return '-';
    const holeData = course.holes.find(h => h.hole === holeNum);
    return holeData ? holeData.par : '-';
  };

  const handleNextHole = () => {
    if (currentHoleIndex < HOLES.length - 1) {
      setCurrentHoleIndex(prev => prev + 1);
    }
  };

  const handlePrevHole = () => {
    if (currentHoleIndex > 0) {
      setCurrentHoleIndex(prev => prev - 1);
    }
  };

  const getTotalPar = () => {
    if (!course || !course.holes) return 0;
    return course.holes.reduce((sum, h) => sum + h.par, 0);
  };

  const handleReview = () => {
    if (!playerId) {
      alert("Please select a Player.");
      return;
    }

    setPlayerTotal(calculateTotal(playerScores));

    if (opponentId) {
      setOpponentTotal(calculateTotal(opponentScores));
    }

    setIsReviewing(true);
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!playerId) return;

    setIsSubmitting(true);
    try {
      // We can check if they already have scores here
      const roundScores = await getScoresForRound(id);

      const primaryAlreadyScored = roundScores.some(s => s.player_id === playerId);
      const opponentAlreadyScored = opponentId && roundScores.some(s => s.player_id === opponentId);

      if (primaryAlreadyScored && opponentAlreadyScored) {
         alert("Scores have already been recorded for both players for this round.");
         setIsSubmitting(false);
         return;
      }

      if (primaryAlreadyScored && !opponentId) {
         alert("The selected primary player already has a score recorded for this round.");
         setIsSubmitting(false);
         return;
      }

      let messages = [];
      const submissionPromises = [];

      if (primaryAlreadyScored) {
         messages.push("The selected primary player already has a score recorded for this round. Their score will not be updated.");
      } else {
         // Submit primary player score
         submissionPromises.push(addScore({
           player_id: playerId,
           round_id: id,
           score: playerTotal
         }));
      }

      if (opponentId) {
         if (opponentAlreadyScored) {
            messages.push("The selected opponent already has a score recorded for this round. Their score will not be updated.");
         } else {
            // Submit opponent score if selected
            submissionPromises.push(addScore({
              player_id: opponentId,
              round_id: id,
              score: opponentTotal
            }));
         }
      }

      if (submissionPromises.length > 0) {
         await Promise.all(submissionPromises);
      }

      if (messages.length > 0) {
         alert(messages.join("\n"));
      }

      // Clear draft
      localStorage.removeItem(`scorecard_draft_${id}`);

      // Navigate back to round details
      navigate(`/rounds/${id}`);
    } catch (error) {
      console.error("Error submitting scores:", error);
      alert("Failed to submit scores. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compute holes array dynamically based on the course
  const HOLES = course && course.holes
    ? course.holes.map(h => h.hole)
    : Array.from({ length: 18 }, (_, i) => i + 1);

  if (!round) return <div className="page-container">Loading...</div>;

  // Find player names for review screen
  const playerObj = players.find(p => p.player_id === playerId);
  const opponentObj = players.find(p => p.player_id === opponentId);

  return (
    <div className="page-container">
      <div className="round-header-details">
        <Link to={`/rounds/${id}`} className="back-link">&larr; Back to Round Details</Link>
        <h2>Scorecard: {new Date(round.date).toLocaleDateString('en-US', { timeZone: 'UTC' })} - {round.location}</h2>
      </div>

      {!isReviewing ? (
        <div className="scorecard-setup">
          <div className="layout-grid" style={{ marginBottom: '2rem' }}>
            <div className="form-group">
              <label htmlFor="playerSelect">Player *</label>
              <select
                id="playerSelect"
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                required
              >
                <option value="">-- Select Player --</option>
                {players.map(p => (
                  <option key={p.player_id} value={p.player_id} disabled={p.player_id === opponentId}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="opponentSelect">Opponent (Optional)</label>
              <select
                id="opponentSelect"
                value={opponentId}
                onChange={(e) => setOpponentId(e.target.value)}
              >
                <option value="">-- Select Opponent --</option>
                {players.map(p => (
                  <option key={p.player_id} value={p.player_id} disabled={p.player_id === playerId}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mobile Hole-by-Hole View */}
          {HOLES.length > 0 && (
            <div className="mobile-only">
              <div className="mobile-hole-card">
                <div className="mobile-hole-header">
                  <span className="mobile-hole-title">Hole {HOLES[currentHoleIndex]}</span>
                  <span className="mobile-hole-par">Par {getParForHole(HOLES[currentHoleIndex])}</span>
                </div>

                <div className="mobile-score-row">
                  <label className="mobile-score-label">{playerObj ? playerObj.name : 'Player'}</label>
                  <input
                    type="number"
                    min="1"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="score-input-large"
                    value={playerScores[HOLES[currentHoleIndex]] || ''}
                    onChange={(e) => handleScoreChange(HOLES[currentHoleIndex], true, e.target.value)}
                  />
                </div>

                {opponentId && (
                  <div className="mobile-score-row">
                    <label className="mobile-score-label">{opponentObj ? opponentObj.name : 'Opponent'}</label>
                    <input
                      type="number"
                      min="1"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="score-input-large"
                      value={opponentScores[HOLES[currentHoleIndex]] || ''}
                      onChange={(e) => handleScoreChange(HOLES[currentHoleIndex], false, e.target.value)}
                    />
                  </div>
                )}

                <div className="mobile-hole-nav">
                  <button
                    onClick={handlePrevHole}
                    className="btn-secondary"
                    disabled={currentHoleIndex === 0}
                  >
                    &larr; Prev
                  </button>
                  <button
                    onClick={handleNextHole}
                    className="btn-primary"
                    disabled={currentHoleIndex === HOLES.length - 1}
                  >
                    Next &rarr;
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Table View */}
          <div className="desktop-only">
            <div className="scorecard-table-wrapper">
              <table className="scorecard-table">
                <thead>
                  <tr>
                    <th>Hole</th>
                    <th>Par</th>
                    <th>{playerObj ? playerObj.name : 'Player Score'}</th>
                    {opponentId && <th>{opponentObj ? opponentObj.name : 'Opponent Score'}</th>}
                  </tr>
                </thead>
                <tbody>
                  {HOLES.map(hole => (
                    <tr key={hole}>
                      <td className="hole-number">{hole}</td>
                      <td className="hole-par">{getParForHole(hole)}</td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="score-input"
                          value={playerScores[hole] || ''}
                          onChange={(e) => handleScoreChange(hole, true, e.target.value)}
                        />
                      </td>
                      {opponentId && (
                        <td>
                          <input
                            type="number"
                            min="1"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="score-input"
                            value={opponentScores[hole] || ''}
                            onChange={(e) => handleScoreChange(hole, false, e.target.value)}
                          />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button onClick={handleReview} className="btn-primary" disabled={!playerId}>
              Review Scorecard
            </button>
          </div>
        </div>
      ) : (
        <div className="scorecard-review">
          <h3>Review Your Scores</h3>

          <div className="review-cards" style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <div className="review-card form-section" style={{ flex: '1', minWidth: '300px' }}>
              <h4>{playerObj?.name}</h4>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '1rem 0', color: '#3498db' }}>
                Total Score: {playerTotal}
              </p>
              <p>Course Par: {getTotalPar()}</p>
              <p>Score vs Par: {playerTotal - getTotalPar() > 0 ? `+${playerTotal - getTotalPar()}` : playerTotal - getTotalPar()}</p>
            </div>

            {opponentId && (
              <div className="review-card form-section" style={{ flex: '1', minWidth: '300px' }}>
                <h4>{opponentObj?.name}</h4>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '1rem 0', color: '#e74c3c' }}>
                  Total Score: {opponentTotal}
                </p>
                <p>Course Par: {getTotalPar()}</p>
                <p>Score vs Par: {opponentTotal - getTotalPar() > 0 ? `+${opponentTotal - getTotalPar()}` : opponentTotal - getTotalPar()}</p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setIsReviewing(false)} className="btn-secondary" disabled={isSubmitting}>
              Edit Scores
            </button>
            <button onClick={handleSubmit} className="btn-primary" style={{ width: 'auto' }} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Final Scores'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Scorecard;
