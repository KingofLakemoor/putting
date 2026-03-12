import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPlayers, getRounds, addScore, getScoresForRound } from '../db';

const HOLES = Array.from({ length: 18 }, (_, i) => i + 1);

function Scorecard() {
  const { id } = useParams(); // round_id
  const navigate = useNavigate();

  const [round, setRound] = useState(null);
  const [players, setPlayers] = useState([]);

  // Dropdown Selections
  const [playerId, setPlayerId] = useState('');
  const [opponentId, setOpponentId] = useState('');

  // Score state: Object with hole number as key
  const [playerScores, setPlayerScores] = useState({});
  const [opponentScores, setOpponentScores] = useState({});

  // View state
  const [isReviewing, setIsReviewing] = useState(false);

  // Computed totals
  const [playerTotal, setPlayerTotal] = useState(0);
  const [opponentTotal, setOpponentTotal] = useState(0);

  useEffect(() => {
    // Load round data
    const allRounds = getRounds();
    const currentRound = allRounds.find(r => r.round_id === id);
    setRound(currentRound);

    // Load all players
    const allPlayers = getPlayers();
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

  const handleSubmit = () => {
    // Basic validation
    if (!playerId) return;

    // We can check if they already have scores here
    const roundScores = getScoresForRound(id);

    let alreadyScored = roundScores.some(s => s.player_id === playerId);
    if (alreadyScored) {
       alert("The selected primary player already has a score recorded for this round.");
       return;
    }

    if (opponentId && roundScores.some(s => s.player_id === opponentId)) {
       alert("The selected opponent already has a score recorded for this round.");
       return;
    }

    // Submit primary player score
    addScore({
      player_id: playerId,
      round_id: id,
      score: playerTotal
    });

    // Submit opponent score if selected
    if (opponentId) {
      addScore({
        player_id: opponentId,
        round_id: id,
        score: opponentTotal
      });
    }

    // Clear draft
    localStorage.removeItem(`scorecard_draft_${id}`);

    // Navigate back to round details
    navigate(`/rounds/${id}`);
  };

  if (!round) return <div className="page-container">Loading...</div>;

  // Find player names for review screen
  const playerObj = players.find(p => p.player_id === playerId);
  const opponentObj = players.find(p => p.player_id === opponentId);

  return (
    <div className="page-container">
      <div className="round-header-details">
        <Link to={`/rounds/${id}`} className="back-link">&larr; Back to Round Details</Link>
        <h2>Scorecard: {new Date(round.date).toLocaleDateString()} - {round.location}</h2>
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

          <div className="scorecard-table-wrapper">
            <table className="scorecard-table">
              <thead>
                <tr>
                  <th>Hole</th>
                  <th>{playerObj ? playerObj.name : 'Player Score'}</th>
                  {opponentId && <th>{opponentObj ? opponentObj.name : 'Opponent Score'}</th>}
                </tr>
              </thead>
              <tbody>
                {HOLES.map(hole => (
                  <tr key={hole}>
                    <td className="hole-number">{hole}</td>
                    <td>
                      <input
                        type="number"
                        min="1"
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

          <div style={{ marginTop: '2rem', textAlign: 'right' }}>
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
            </div>

            {opponentId && (
              <div className="review-card form-section" style={{ flex: '1', minWidth: '300px' }}>
                <h4>{opponentObj?.name}</h4>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '1rem 0', color: '#e74c3c' }}>
                  Total Score: {opponentTotal}
                </p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setIsReviewing(false)} className="btn-secondary">
              Edit Scores
            </button>
            <button onClick={handleSubmit} className="btn-primary" style={{ width: 'auto' }}>
              Submit Final Scores
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Scorecard;
