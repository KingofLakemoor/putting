import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getPlayers, addPlayer, updatePlayer } from '../db';

function SignIn() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setResetMessage('');
      setLoading(true);
      const userCredential = await login(email, password);
      const user = userCredential.user;

      // Check if player profile exists
      try {
        const players = await getPlayers();
        const existingPlayer = players.find(p => p.email && p.email.toLowerCase() === email.toLowerCase());

        if (!existingPlayer) {
          // Fallback profile creation for stranded users
          const fallbackName = email.split('@')[0];
          await addPlayer({ name: fallbackName, email, uid: user.uid });
        } else if (!existingPlayer.uid || existingPlayer.uid.length === 36) {
          // If an existing player profile was found but has no UID (e.g., added manually via admin),
          // or has a generated UUID (36 chars), automatically link this user's Auth UID to it.
          await updatePlayer(existingPlayer.player_id, { uid: user.uid });
        }
      } catch (dbError) {
        console.warn("Could not verify/create fallback player profile", dbError);
      }

      navigate(from, { replace: true });
    } catch (err) {
      setError('Failed to sign in. ' + err.message);
    }
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      return setError('Please enter an email address to reset password.');
    }
    try {
      setError('');
      setResetMessage('');
      setLoading(true);
      await resetPassword(email);
      setResetMessage('Password reset email sent. Check your inbox.');
    } catch (err) {
      setError('Failed to reset password. ' + err.message);
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
      if (err.code === 'auth/email-already-in-use') {
        setError("An account with this email already exists. Please switch to Sign In and use 'Forgot Password' if you do not remember your password.");
      } else {
        setError('Failed to create an account. ' + err.message);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white p-6 flex flex-col items-center justify-center font-sans relative overflow-hidden">
      {/* Background visual element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-kelly-green/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="font-sports text-5xl tracking-wide uppercase text-white mb-2">Club 602</h1>
          <p className="font-data text-xs text-slate-500 uppercase tracking-widest">
            {isSignUp ? 'Create Account' : 'Player Portal'}
          </p>
        </div>

        <div className="bg-dark-surface border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10">
          <h2 className="font-sports text-2xl mb-6 text-kelly-green flex items-center gap-2">
            {isSignUp ? <UserPlus size={24} /> : <LogIn size={24} />}
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </h2>

          {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-6 text-sm">{error}</div>}
          {resetMessage && <div className="bg-kelly-green/10 border border-kelly-green/50 text-kelly-green p-3 rounded-lg mb-6 text-sm">{resetMessage}</div>}

          <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="flex flex-col gap-4">
            <AnimatePresence mode="popLayout">
              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-col gap-4"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="firstName">First Name</label>
                    <input
                      type="text"
                      id="firstName"
                      className="w-full bg-dark-bg border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-kelly-green focus:outline-none transition-colors"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required={isSignUp}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="lastName">Last Name</label>
                    <input
                      type="text"
                      id="lastName"
                      className="w-full bg-dark-bg border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-kelly-green focus:outline-none transition-colors"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required={isSignUp}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                className="w-full bg-dark-bg border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-kelly-green focus:outline-none transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                className="w-full bg-dark-bg border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-kelly-green focus:outline-none transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="mt-4 flex flex-col gap-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-kelly-green text-dark-bg py-4 rounded-xl font-bold uppercase tracking-wider hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isSignUp ? 'Create Account' : 'Access Portal'}
              </button>

              {!isSignUp && (
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={loading}
                  className="text-xs text-slate-400 hover:text-white transition-colors underline disabled:opacity-50"
                >
                  Forgot Password?
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="text-center mt-8 text-sm">
          <span className="text-slate-500">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          </span>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setResetMessage('');
            }}
            className="text-kelly-green hover:text-green-400 font-bold ml-1 transition-colors"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default SignIn;
