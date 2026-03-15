import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getPlayers, addPlayer, updatePlayer } from '../db';

function SignIn() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError('Failed to sign in. ' + err.message);
    }
    setLoading(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);

      if (!firstName.trim() || !lastName.trim()) {
        throw new Error('First and last name are required for sign up.');
      }

      const { user } = await signup(email, password);

      const formattedName = `${firstName.trim()} ${lastName.trim().charAt(0).toUpperCase()}.`;

      try {
        const players = await getPlayers();
        const existingPlayer = players.find(p => p.email && p.email.toLowerCase() === email.toLowerCase());

        if (!existingPlayer) {
          await addPlayer({ name: formattedName, email, uid: user.uid });
        } else {
          // Merge the newly created account with the existing player data for that email
          await updatePlayer(existingPlayer.player_id, { name: formattedName, uid: user.uid });
        }
      } catch (dbError) {
        console.warn("Could not fetch players for merge, falling back to creating new player record.", dbError);
        // Fallback: If we can't read players due to permissions, just add the new player.
        try {
          await addPlayer({ name: formattedName, email, uid: user.uid });
        } catch (addError) {
          console.error("Failed to add player as well:", addError);
          // If even addPlayer fails, we might still want to let them log in,
          // but there will be no player profile in Firestore.
          // Still navigating them since their auth is created.
        }
      }

      navigate(from, { replace: true });
    } catch (err) {
      setError('Failed to create an account. ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="page-container">
      <h2>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
      <div className="form-section" style={{ maxWidth: '400px', margin: '0 auto' }}>
        {error && <div className="error-alert" style={{ color: '#e0777d', marginBottom: '1rem' }}>{error}</div>}
        <form className="add-form" onSubmit={isSignUp ? handleSignUp : handleLogin}>
          {isSignUp && (
            <>
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required={isSignUp}
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required={isSignUp}
                />
              </div>
            </>
          )}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%' }}
            >
              {isSignUp ? 'Sign Up' : 'Log In'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <span style={{ color: 'var(--text-color)' }}>
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-color)',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: 0,
                  font: 'inherit'
                }}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SignIn;
