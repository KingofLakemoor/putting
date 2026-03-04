import React, { useState, useEffect } from 'react';
import { getPlayers, addPlayer } from '../db';

function Players() {
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [handicap, setHandicap] = useState('');

  useEffect(() => {
    setPlayers(getPlayers());
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newPlayer = {
      name,
      email,
      handicap: handicap ? parseFloat(handicap) : null
    };

    const created = addPlayer(newPlayer);
    setPlayers([...players, created]);

    // Reset form
    setName('');
    setEmail('');
    setHandicap('');
  };

  return (
    <div className="page-container">
      <div className="layout-grid">
        <div className="list-section">
          <h2>Players List</h2>
          {players.length === 0 ? (
            <p>No players added yet.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Handicap</th>
                </tr>
              </thead>
              <tbody>
                {players.map(player => (
                  <tr key={player.player_id}>
                    <td>{player.name}</td>
                    <td>{player.email}</td>
                    <td>{player.handicap !== null ? player.handicap : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="form-section">
          <h2>Add New Player</h2>
          <form onSubmit={handleSubmit} className="add-form">
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="handicap">Handicap (Optional)</label>
              <input
                type="number"
                id="handicap"
                step="0.1"
                value={handicap}
                onChange={(e) => setHandicap(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-primary">Add Player</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Players;
