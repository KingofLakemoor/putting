import React, { useState, useEffect } from 'react';
import { getPlayers, addPlayer } from '../db';

function Players() {
  const [players, setPlayers] = useState([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    getPlayers().then(setPlayers);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;

    const formattedName = `${firstName.trim()} ${lastName.trim().charAt(0).toUpperCase()}.`;

    const newPlayer = {
      name: formattedName,
      email
    };

    const created = await addPlayer(newPlayer);
    setPlayers([...players, created]);

    // Reset form
    setFirstName('');
    setLastName('');
    setEmail('');
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
                </tr>
              </thead>
              <tbody>
                {players.map(player => (
                  <tr key={player.player_id}>
                    <td>{player.name}</td>
                    <td>{player.email}</td>
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
              <label htmlFor="firstName">First Name *</label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name *</label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
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

            <button type="submit" className="btn-primary">Add Player</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Players;
