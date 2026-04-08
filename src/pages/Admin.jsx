import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Users, CalendarDays, ClipboardList, Map as MapIcon, UserCog, Edit, Trash2, Check, X, Settings, RefreshCw, BookOpen, Star } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { getPlayers, addPlayer, updatePlayer, deletePlayer, getRounds, addRound, updateRoundStatus, updateRoundSeason, deleteRound, getScores, addScore, updateScore, deleteScore, getCourses, addCourse, updateCourse, deleteCourse, getCoordinators, addCoordinator, removeCoordinator, getSettings, updateLiveSeason, updateCupFinaleSeason, addArchivedSeason, removeArchivedSeason, recalculateCupPointsForEvent } from '../db';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatDisplayName } from '../utils/format';

function Admin() {
  const [activeTab, setActiveTab] = useState('players');
  const auth = useAuth();
  const currentUser = auth.currentUser;
  const isAdmin = auth.isAdmin;
  const isCoordinator = auth.isCoordinator;

  // Protect the route
  if (!currentUser || (!isAdmin && !isCoordinator)) {
    return (
      <div className="min-h-screen bg-dark-bg text-white p-6 flex flex-col items-center justify-center font-sans">
        <ShieldAlert size={64} className="text-red-500 mb-6" />
        <h2 className="font-sports text-4xl uppercase tracking-widest text-white mb-4">Unauthorized Access</h2>
        <p className="text-slate-400 text-center max-w-md">You do not have permission to access the admin dashboard. Contact the administrator if you believe this is a mistake.</p>
      </div>
    );
  }

  const tabs = [
    { id: 'players', label: 'Manage Players', icon: Users },
    { id: 'rounds', label: 'Manage Events', icon: CalendarDays },
    { id: 'scores', label: 'Manage Scores', icon: ClipboardList },
  ];
  if (isAdmin) {
    tabs.push({ id: 'courses', label: 'Manage Courses', icon: MapIcon });
    tabs.push({ id: 'coordinators', label: 'Manage Coordinators', icon: UserCog });
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white p-4 md:p-8 font-sans">
      <div className="mb-8 border-b border-slate-800 pb-4 flex justify-between items-start md:items-center flex-col md:flex-row gap-4 md:gap-0">
        <div>
          <h2 className="font-sports text-4xl uppercase tracking-tighter text-white flex items-center gap-3">
            <ShieldAlert className="text-kelly-green" size={32} /> Admin Dashboard
          </h2>
          <p className="font-data text-[10px] text-slate-500 uppercase tracking-[0.2em]">System Management</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <a
            href="/SEASON_1_FAQ.md"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white px-4 py-2 rounded-xl transition-all border border-slate-800 hover:border-slate-600 text-xs font-bold uppercase tracking-wider"
          >
            <BookOpen size={16} className="text-kelly-green" /> Season 1 FAQ
          </a>
          <a
            href="/COORDINATOR_GUIDE.md"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white px-4 py-2 rounded-xl transition-all border border-slate-800 hover:border-slate-600 text-xs font-bold uppercase tracking-wider"
          >
            <BookOpen size={16} className="text-kelly-green" /> Coordinator Guide
          </a>
        </div>
      </div>

      <div className="flex overflow-x-auto mb-8 bg-slate-800/50 p-1 rounded-xl w-full sm:w-auto sm:inline-flex no-scrollbar">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-kelly-green text-dark-bg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className="admin-content">
        {activeTab === 'players' && <AdminPlayers />}
        {activeTab === 'rounds' && <AdminEvents />}
        {activeTab === 'scores' && <AdminScores />}
        {activeTab === 'courses' && isAdmin && <AdminCourses />}
        {activeTab === 'coordinators' && isAdmin && <AdminCoordinators />}
      </div>
    </div>
  );
}

function AdminCoordinators() {
  const [coordinators, setCoordinators] = useState([]);
  const [players, setPlayers] = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    setCoordinators(await getCoordinators());
    setPlayers(await getPlayers());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddCoordinator = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedPlayerId) return;

    const player = players.find(p => p.player_id === selectedPlayerId);
    if (!player || !player.uid) {
      setError("This player does not have an associated user account (UID) and cannot be made a coordinator.");
      return;
    }

    try {
      await addCoordinator(player.uid, player.email || null, player.name);
      setSelectedPlayerId('');
      loadData();
    } catch (error) {
      console.error("Error adding coordinator:", error);
      setError("Failed to add coordinator.");
    }
  };

  const handleRemoveCoordinator = async (uid) => {
    setError('');
    if (window.confirm("Are you sure you want to remove this coordinator?")) {
      try {
        await removeCoordinator(uid);
        loadData();
      } catch (error) {
        console.error("Error removing coordinator:", error);
        setError("Failed to remove coordinator.");
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {error && (
        <div className="bg-red-500/10 text-red-500 p-3 rounded-xl text-xs font-bold uppercase tracking-wider mb-2 lg:col-span-3">
          {error}
        </div>
      )}
      <div className="lg:col-span-2">
        <h3 className="font-sports text-2xl uppercase tracking-widest text-slate-300 mb-6 flex items-center gap-2">
          <UserCog size={20} className="text-kelly-green" /> Coordinators List
        </h3>

        {coordinators.length === 0 ? (
          <div className="text-center text-slate-500 p-12 border border-dashed border-slate-800 rounded-2xl bg-dark-surface/30">
            No coordinators assigned yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-800 text-slate-400 uppercase tracking-wider text-xs">
                <tr>
                  <th className="p-4 font-bold">Name</th>
                  <th className="p-4 font-bold">Email</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {coordinators.map(coord => (
                  <tr key={coord.uid} className="hover:bg-dark-surface/50 transition-colors">
                    <td className="p-4 font-bold">{coord.name}</td>
                    <td className="p-4 text-slate-300">{coord.email}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleRemoveCoordinator(coord.uid)} className="inline-flex items-center gap-1 bg-red-500/10 text-red-500 px-3 py-1.5 rounded-lg font-bold hover:bg-red-500 hover:text-white transition-colors text-xs uppercase">
                        <Trash2 size={14} /> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h3 className="font-sports text-2xl uppercase tracking-widest text-slate-300 mb-6 flex items-center gap-2">
          <Check size={20} className="text-kelly-green" /> Assign Coordinator
        </h3>
        <div className="bg-dark-surface border border-slate-800 rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleAddCoordinator} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="coordinatorSelect">Select Player</label>
              <select
                id="coordinatorSelect"
                value={selectedPlayerId}
                onChange={(e) => {
                  setSelectedPlayerId(e.target.value);
                  setError('');
                }}
                required
                className="w-full bg-dark-bg border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-kelly-green focus:outline-none transition-colors appearance-none"
              >
                <option value="">-- Select a player --</option>
                {players.filter(p => p.uid && !coordinators.some(c => c.uid === p.uid)).map(player => (
                  <option key={player.player_id} value={player.player_id}>
                    {formatDisplayName(player.name, players)} ({player.email || 'No email'})
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="w-full bg-kelly-green text-dark-bg py-3 rounded-xl font-bold uppercase tracking-wider hover:bg-green-500 transition-colors mt-2">
              Add Coordinator
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function AdminPlayers() {
  const [players, setPlayers] = useState([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [uid, setUid] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);

  const loadPlayers = async () => {
    setPlayers(await getPlayers());
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;

    const formattedName = `${firstName.trim()} ${lastName.trim().charAt(0).toUpperCase()}.`;

    const playerData = { name: formattedName, email };
    if (uid.trim()) {
      playerData.uid = uid.trim();
    }

    if (editingId) {
      await updatePlayer(editingId, playerData);
      setEditingId(null);
    } else {
      await addPlayer(playerData);
    }

    setFirstName('');
    setLastName('');
    setEmail('');
    setUid('');
    loadPlayers();
  };

  const handleEdit = (player) => {
    setEditingId(player.player_id);

    // Attempt to split the name. "First Last Initial." or "First Last"
    const nameParts = player.name ? player.name.split(' ') : [];
    if (nameParts.length >= 2) {
      setFirstName(nameParts.slice(0, -1).join(' '));
      // Remove trailing period if present
      let lName = nameParts[nameParts.length - 1];
      if (lName.endsWith('.')) {
          lName = lName.slice(0, -1);
      }
      setLastName(lName);
    } else {
      setFirstName(player.name || '');
      setLastName('');
    }

    setEmail(player.email || '');
    setUid(player.uid || '');
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this player? This will also delete their scores.")) {
      await deletePlayer(id);
      loadPlayers();
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFirstName('');
    setLastName('');
    setEmail('');
    setUid('');
  };

  const handleGenerateMissingUids = async () => {
    const playersMissingUid = players.filter(p => !p.uid);
    if (playersMissingUid.length === 0) {
      setError("All players already have a UID.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (window.confirm(`Are you sure you want to generate UIDs for ${playersMissingUid.length} players?`)) {
      for (const player of playersMissingUid) {
        await updatePlayer(player.player_id, { uid: uuidv4() });
      }
      loadPlayers();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-sports text-2xl uppercase tracking-widest text-slate-300 flex items-center gap-2">
            <Users size={20} className="text-kelly-green" /> Players List
          </h3>
          <div className="flex items-center gap-2">
            {error && <div className="bg-red-500/10 text-red-500 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider">{error}</div>}
            <button
            onClick={handleGenerateMissingUids}
            className="inline-flex items-center gap-1 bg-slate-700 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-slate-600 transition-colors text-xs uppercase"
          >
              <RefreshCw size={14} /> Generate Missing UIDs
            </button>
          </div>
        </div>

        {players.length === 0 ? (
          <div className="text-center text-slate-500 p-12 border border-dashed border-slate-800 rounded-2xl bg-dark-surface/30">
            No players added yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-800 text-slate-400 uppercase tracking-wider text-xs">
                <tr>
                  <th className="p-4 font-bold">Name</th>
                  <th className="p-4 font-bold">Email</th>
                  <th className="p-4 font-bold">UID</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {players.map(player => (
                  <tr key={player.player_id} className="hover:bg-dark-surface/50 transition-colors">
                    <td className="p-4 font-bold">{formatDisplayName(player.name, players)}</td>
                    <td className="p-4 text-slate-300">{player.email}</td>
                    <td className="p-4 text-slate-400 text-xs font-mono">{player.uid || 'N/A'}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(player)} className="inline-flex items-center gap-1 bg-slate-700 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-slate-600 transition-colors text-xs uppercase">
                          <Edit size={14} /> Edit
                        </button>
                        <button onClick={() => handleDelete(player.player_id)} className="inline-flex items-center gap-1 bg-red-500/10 text-red-500 px-3 py-1.5 rounded-lg font-bold hover:bg-red-500 hover:text-white transition-colors text-xs uppercase">
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h3 className="font-sports text-2xl uppercase tracking-widest text-slate-300 mb-6 flex items-center gap-2">
          <Edit size={20} className="text-kelly-green" /> {editingId ? 'Edit Player' : 'Add New Player'}
        </h3>

        <div className="bg-dark-surface border border-slate-800 rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="playerFirstName">First Name *</label>
              <input
                type="text"
                id="playerFirstName"
                className="w-full bg-dark-bg border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-kelly-green focus:outline-none transition-colors"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="playerLastName">Last Name *</label>
              <input
                type="text"
                id="playerLastName"
                className="w-full bg-dark-bg border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-kelly-green focus:outline-none transition-colors"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="playerEmail">Email</label>
              <input
                type="email"
                id="playerEmail"
                className="w-full bg-dark-bg border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-kelly-green focus:outline-none transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="playerUid">Firebase UID</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="playerUid"
                  className="w-full bg-dark-bg border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-kelly-green focus:outline-none transition-colors font-mono text-sm"
                  value={uid}
                  onChange={(e) => setUid(e.target.value)}
                  placeholder="Optional Auth UID"
                />
                <button
                  type="button"
                  onClick={() => setUid(uuidv4())}
                  className="bg-slate-700 text-white px-4 py-3 rounded-xl font-bold uppercase tracking-wider hover:bg-slate-600 transition-colors text-xs flex items-center justify-center whitespace-nowrap"
                  title="Generate random UUID"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            <div className="mt-2 flex flex-col gap-3">
              <button type="submit" className="w-full bg-kelly-green text-dark-bg py-3 rounded-xl font-bold uppercase tracking-wider hover:bg-green-500 transition-colors flex items-center justify-center gap-2">
                <Check size={16} /> {editingId ? 'Update Player' : 'Add Player'}
              </button>
              {editingId && (
                <button type="button" onClick={cancelEdit} className="w-full bg-slate-700 text-white py-3 rounded-xl font-bold uppercase tracking-wider hover:bg-slate-600 transition-colors flex items-center justify-center gap-2">
                  <X size={16} /> Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function AdminEvents() {
  const [rounds, setRounds] = useState([]);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [courseId, setCourseId] = useState('');
  const [isSignature, setIsSignature] = useState(false);
  const [scoreLimit, setScoreLimit] = useState('');
  const [roundFormat, setRoundFormat] = useState('Open');
  const [cutLine, setCutLine] = useState('');
  const [numberOfRounds, setNumberOfRounds] = useState('');
  const [courses, setCourses] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [seasons, setSeasons] = useState([]);
  const [liveSeason, setLiveSeason] = useState('');
  const [cupFinaleSeason, setCupFinaleSeason] = useState('');
  const [archivedSeasons, setArchivedSeasons] = useState([]);

  const loadData = async () => {
    const allRounds = await getRounds();
    setRounds(allRounds);
    setCourses(await getCourses());

    const settings = await getSettings();
    setLiveSeason(settings.live_season || '');
    setCupFinaleSeason(settings.cup_finale_season || '');
    setArchivedSeasons(settings.archived_seasons || []);

    const uniqueSeasons = [...new Set(allRounds.map(r => r.season).filter(Boolean))];
    setSeasons(uniqueSeasons);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !courseId) return;

    const selectedCourse = courses.find(c => c.course_id === courseId);

    // Grouping event ID
    const event_id = uuidv4();

    const baseRound = {
      date,
      location: selectedCourse ? selectedCourse.name : 'Unknown Location',
      course_id: courseId,
      is_signature: isSignature,
      score_limit: ['Tour', 'Match Play', 'Cut Down'].includes(roundFormat) ? 1 : (scoreLimit ? parseInt(scoreLimit, 10) : null),
      round_format: roundFormat,
      event_id: event_id,
      ...(roundFormat === 'Cut Down' && cutLine && { cut_line: parseInt(cutLine, 10) }),
      ...((roundFormat === 'Cut Down' || roundFormat === 'Tour') && numberOfRounds && { number_of_rounds: parseInt(numberOfRounds, 10) })
    };

    const numRounds = parseInt(numberOfRounds, 10);

    if (!isNaN(numRounds) && numRounds > 1 && (roundFormat === 'Cut Down' || roundFormat === 'Tour')) {
      for (let i = 1; i <= numRounds; i++) {
        await addRound({
          ...baseRound,
          name: `${name} - Round ${i}`
        });
      }
    } else {
      await addRound({
        ...baseRound,
        name
      });
    }

    // Reset form
    setName('');
    setDate('');
    setCourseId('');
    setIsSignature(false);
    setScoreLimit('');
    setRoundFormat('Open');
    setCutLine('');
    setNumberOfRounds('');
    loadData();
  };

  const handleStatusChange = async (id, newStatus, round) => {
    await updateRoundStatus(id, newStatus);
    if (newStatus.toLowerCase() === 'completed') {
        // Calculate points when status is changed to completed, skip for Open formats
        if (round.round_format !== 'Open') {
          await recalculateCupPointsForEvent(id, round.is_signature);
        }
    }
    loadData();
  };

  const handleSeasonChange = async (id, newSeason) => {
    await updateRoundSeason(id, newSeason);
    loadData();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this round? This will also delete all associated scores.")) {
      await deleteRound(id);
      loadData();
    }
  };

  const handleLiveSeasonChange = async (e) => {
    const season = e.target.value;
    setLiveSeason(season);
    await updateLiveSeason(season);
  };

  const handleCupFinaleSeasonChange = async (e) => {
    const season = e.target.value;
    setCupFinaleSeason(season);
    await updateCupFinaleSeason(season);
  };

  const toggleSignatureStatus = async (round_id, currentStatus) => {
    const roundRef = doc(db, 'putting_league_rounds', round_id);
    await updateDoc(roundRef, { is_signature: !currentStatus });
    loadData();
  };

  const handleToggleArchiveSeason = async (season) => {
    if (archivedSeasons.includes(season)) {
      await removeArchivedSeason(season);
    } else {
      await addArchivedSeason(season);
    }
    loadData();
  };

  const filteredRounds = rounds.filter(round =>
    showArchived ? (round.status || '').toLowerCase() === 'archived' : (round.status || '').toLowerCase() !== 'archived'
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div>
          <h3 className="font-sports text-2xl uppercase tracking-widest text-slate-300 mb-6 flex items-center gap-2">
            <Settings size={20} className="text-kelly-green" /> Season Settings
          </h3>
          <div className="bg-dark-surface border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="liveSeason">Live Season</label>
              <select
                id="liveSeason"
                value={liveSeason}
                onChange={handleLiveSeasonChange}
                className="w-full bg-dark-bg border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-kelly-green focus:outline-none transition-colors appearance-none"
              >
                <option value="">-- Select Live Season --</option>
                {seasons.map(season => (
                  <option key={`live_${season}`} value={season}>{season}</option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 mt-2">Sets the default season shown on the dashboard when no active rounds exist.</p>
            </div>

            <div className="flex-1 border-l border-slate-700 pl-8">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="cupFinaleSeason">602 Cup Finale Season</label>
              <select
                id="cupFinaleSeason"
                value={cupFinaleSeason}
                onChange={handleCupFinaleSeasonChange}
                className="w-full bg-dark-bg border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-kelly-green focus:outline-none transition-colors appearance-none"
              >
                <option value="">-- Select Finale Season --</option>
                {seasons.map(season => (
                  <option key={`finale_${season}`} value={season}>{season}</option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 mt-2">Starting strokes (-4 to E) will be automatically applied to this season.</p>
            </div>

            <div className="flex-1 border-l border-slate-700 pl-8">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Archive Seasons</label>
              {seasons.length === 0 ? (
                <p className="text-slate-500 text-sm">No seasons available.</p>
              ) : (
                <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {seasons.map(season => {
                    const isArchived = archivedSeasons.includes(season);
                    return (
                      <div key={`archive_${season}`} className="flex items-center justify-between bg-dark-bg border border-slate-800 rounded p-2">
                        <span className={`text-sm ${isArchived ? 'text-slate-500 line-through' : 'text-white'}`}>{season}</span>
                        <button
                          onClick={() => handleToggleArchiveSeason(season)}
                          className={`text-[10px] uppercase font-bold px-2 py-1 rounded transition-colors ${
                            isArchived ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'
                          }`}
                        >
                          {isArchived ? 'Unarchive' : 'Archive'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-6">
          <h3 className="font-sports text-2xl uppercase tracking-widest text-slate-300 flex items-center gap-2">
            <CalendarDays size={20} className="text-kelly-green" /> {showArchived ? 'Archived Events' : 'Events Management'}
          </h3>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
          >
            {showArchived ? 'View Active & Completed' : 'View Archived Events'}
          </button>
        </div>

        {filteredRounds.length === 0 ? (
          <div className="text-center text-slate-500 p-12 border border-dashed border-slate-800 rounded-2xl bg-dark-surface/30">
            {showArchived ? 'No archived events.' : 'No active or completed events added yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-800 text-slate-400 uppercase tracking-wider text-xs">
                <tr>
                  <th className="p-4 font-bold">Name</th>
                  <th className="p-4 font-bold">Date & Location</th>
                  <th className="p-4 font-bold">Season & Status</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredRounds.map(round => (
                  <tr key={round.round_id} className="hover:bg-dark-surface/50 transition-colors">
                    <td className="p-4 font-bold">
                       {round.name || '-'}
                       {round.is_signature && <Star size={12} className="inline ml-2 text-yellow-500 mb-1" />}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-white">{round.date && !isNaN(new Date(round.date).getTime()) ? new Date(round.date).toLocaleDateString('en-US', { timeZone: 'UTC' }) : 'No Date'}</span>
                        <span className="text-xs text-slate-400">{round.location}</span>
                        {round.score_limit && (
                          <span className="text-[10px] text-kelly-green uppercase font-bold mt-1">Limit: {round.score_limit} Scores</span>
                        )}
                        {round.round_format && round.round_format !== 'Open' && (
                          <span className="text-[10px] text-yellow-500 uppercase font-bold mt-1">Format: {round.round_format}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          defaultValue={round.season || ''}
                          onBlur={(e) => handleSeasonChange(round.round_id, e.target.value)}
                          placeholder="Season..."
                          className="w-full max-w-[120px] bg-dark-bg border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-kelly-green focus:outline-none"
                        />
                        <select
                          value={round.status}
                          onChange={(e) => handleStatusChange(round.round_id, e.target.value, round)}
                          className="w-full max-w-[120px] bg-dark-bg border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-kelly-green focus:outline-none appearance-none"
                        >
                          <option value="Active">Active</option>
                          <option value="Completed">Completed</option>
                          <option value="Archived">Archived</option>
                        </select>
                      </div>
                    </td>
                    <td className="p-4 text-right align-top">
                      <div className="flex justify-end gap-2 flex-col items-end">
                        <Link to={`/rounds/${round.round_id}`} className="inline-flex items-center gap-1 bg-slate-700 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-slate-600 transition-colors text-[10px] uppercase w-full justify-center">
                          <Edit size={12} /> Manage
                        </Link>
                        <button onClick={() => handleDelete(round.round_id)} className="inline-flex items-center gap-1 bg-red-500/10 text-red-500 px-3 py-1.5 rounded-lg font-bold hover:bg-red-500 hover:text-white transition-colors text-[10px] uppercase w-full justify-center">
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                      <div className="mt-2 text-right">
                        <button
                          onClick={() => toggleSignatureStatus(round.round_id, round.is_signature)}
                          className={`text-[10px] uppercase font-bold px-2 py-1 rounded transition-colors ${round.is_signature ? 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                        >
                          {round.is_signature ? 'Signature Event (1.5x)' : 'Make Signature'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </div>

      <div>
        <h3 className="font-sports text-2xl uppercase tracking-widest text-slate-300 mb-6 flex items-center gap-2">
          <Edit size={20} className="text-kelly-green" /> Create New Event
        </h3>
        <div className="bg-dark-surface border border-slate-800 rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="name">Event Name</label>
              <input
                type="text"
                id="name"
                className="w-full bg-dark-bg border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-kelly-green focus:outline-none transition-colors"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Finals, Round 1"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="date">Date *</label>
              <input
                type="date"
                id="date"
                className="w-full bg-dark-bg border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-kelly-green focus:outline-none transition-colors"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="course">Location / Venue *</label>
              <select
                id="course"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                required
                className="w-full bg-dark-bg border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-kelly-green focus:outline-none transition-colors appearance-none"
              >
                <option value="">-- Select Course --</option>
                {courses.map(course => (
                  <option key={course.course_id} value={course.course_id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>


            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="roundFormat">Event Format</label>
              <select
                id="roundFormat"
                value={roundFormat}
                onChange={(e) => setRoundFormat(e.target.value)}
                className="w-full bg-dark-bg border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-kelly-green focus:outline-none transition-colors appearance-none"
              >
                <option value="Open">Open</option>
                <option value="Cut Down">Cut Down</option>
                <option value="Match Play">Match Play</option>
                <option value="Tour">Tour</option>
              </select>
            </div>

            {roundFormat === 'Cut Down' && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="cutLine">Cut Line</label>
                <input
                  type="number"
                  id="cutLine"
                  className="w-full bg-dark-bg border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-kelly-green focus:outline-none transition-colors"
                  value={cutLine}
                  onChange={(e) => setCutLine(e.target.value)}
                  placeholder="e.g., top X players"
                  min="1"
                  required
                />
              </div>
            )}

            {(roundFormat === 'Cut Down' || roundFormat === 'Tour') && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="numberOfRounds">Number of Rounds</label>
                <input
                  type="number"
                  id="numberOfRounds"
                  className="w-full bg-dark-bg border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-kelly-green focus:outline-none transition-colors"
                  value={numberOfRounds}
                  onChange={(e) => setNumberOfRounds(e.target.value)}
                  placeholder="Total rounds in event"
                  min="1"
                  required
                />
              </div>
            )}

            {!['Tour', 'Match Play', 'Cut Down'].includes(roundFormat) && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="scoreLimit">Score Submission Limit</label>
                <input
                  type="number"
                  id="scoreLimit"
                  className="w-full bg-dark-bg border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-kelly-green focus:outline-none transition-colors"
                  value={scoreLimit}
                  onChange={(e) => setScoreLimit(e.target.value)}
                  placeholder="Leave blank for unlimited"
                  min="1"
                />
                <p className="text-[10px] text-slate-500 mt-2">Maximum number of scores a single player can submit for this round.</p>
              </div>
            )}

            <div className="flex items-center gap-3 p-4 bg-dark-bg border border-slate-700 rounded-xl cursor-pointer" onClick={() => setIsSignature(!isSignature)}>
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSignature ? 'bg-yellow-500 border-yellow-500' : 'border-slate-500'}`}>
                 {isSignature && <Check size={14} className="text-dark-bg" />}
              </div>
              <div>
                <p className="font-bold text-sm uppercase text-white">Signature Event</p>
                <p className="text-[10px] text-slate-400 uppercase">1.5x Multiplier for 602 Cup Points</p>
              </div>
            </div>

            <button type="submit" className="w-full bg-kelly-green text-dark-bg py-3 rounded-xl font-bold uppercase tracking-wider hover:bg-green-500 transition-colors mt-2 flex items-center justify-center gap-2">
              <Check size={16} /> Create Event
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function AdminScores() {
  const [scores, setScores] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [players, setPlayers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [scoreValue, setScoreValue] = useState('');

  // New Score Form State
  const [newRoundId, setNewRoundId] = useState('');
  const [newPlayerId, setNewPlayerId] = useState('');
  const [newScoreValue, setNewScoreValue] = useState('');
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [scoreError, setScoreError] = useState(null);

  const loadData = async () => {
    setScores(await getScores());
    setRounds(await getRounds());
    setPlayers(await getPlayers());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEdit = (score) => {
    setEditingId(score.score_id);
    setScoreValue(score.score);
  };

  const handleAddScore = async (e) => {
    e.preventDefault();
    setScoreError(null);

    if (!newRoundId || !newPlayerId || newScoreValue === '') {
      setScoreError('Please fill in all fields.');
      return;
    }

    if (isSubmittingScore) return;

    // Check for score limit for this round
    const round = rounds.find(r => r.round_id === newRoundId);
    const limit = (round && round.score_limit) ? round.score_limit : 1;

    const existingScoresCount = scores.filter(
      s => s.round_id === newRoundId && s.player_id === newPlayerId
    ).length;

    if (existingScoresCount >= limit) {
      setScoreError(`This player already has reached the limit of ${limit} score(s) for this round.`);
      return;
    }

    setIsSubmittingScore(true);
    try {
      const customScoreId = limit > 1 ? `score_${newRoundId}_${newPlayerId}_${existingScoresCount}` : `score_${newRoundId}_${newPlayerId}`;

      await addScore({
        player_id: newPlayerId,
        round_id: newRoundId,
        score: parseInt(newScoreValue, 10)
      }, customScoreId);

      setNewRoundId('');
      setNewPlayerId('');
      setNewScoreValue('');
      loadData();
    } catch (error) {
      console.error("Error adding score:", error);
      setScoreError('Failed to add score.');
    } finally {
      setIsSubmittingScore(false);
    }
  };

  const handleSave = async (id) => {
    const numValue = parseInt(scoreValue, 10);
    if (!isNaN(numValue)) {
      await updateScore(id, numValue);
      setEditingId(null);
      loadData();
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setScoreValue('');
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this score?")) {
      await deleteScore(id);
      loadData();
    }
  };

  const playersMap = useMemo(() => {
    const map = new Map();
    players.forEach(p => {
      if (!p) return;
      if (p.player_id) map.set(p.player_id, p);
      if (p.uid) map.set(p.uid, p);
    });
    return map;
  }, [players]);

  const playersByName = useMemo(() => {
    const map = new Map();
    players.forEach(p => {
      if (!p) return;
      if (p.name) map.set(p.name.toLowerCase(), p);
    });
    return map;
  }, [players]);

  const roundsMap = useMemo(() => {
    const map = new Map();
    rounds.forEach(r => {
      if (!r) return;
      if (r.round_id) map.set(r.round_id, r);
    });
    return map;
  }, [rounds]);

  const getPlayerName = (id, round_id) => {
    let player = playersMap.get(id);
    if (!player && round_id) {
       const round = roundsMap.get(round_id);
       if (round && round.player_id === id && typeof round.player_name === 'string') {
           player = playersByName.get(round.player_name.toLowerCase());
       }
    }

    // Fallback if player document STILL not found, just show the name from the round so it's not "Unknown"
    if (!player && round_id) {
        const round = roundsMap.get(round_id);
        if (round && round.player_id === id && round.player_name) {
             return formatDisplayName(round.player_name, players);
        }
    }

    return player ? formatDisplayName(player.name, players) : 'Unknown Player';
  };

  const getRoundDetails = (id) => {
    const round = roundsMap.get(id);
    if (!round) return 'Unknown Round';

    const dateStr = round.date && !isNaN(new Date(round.date).getTime()) ? new Date(round.date).toLocaleDateString('en-US', { timeZone: 'UTC' }) : 'No Date';
    return round.name ? `${round.name} - ${dateStr} - ${round.location}` : `${dateStr} - ${round.location}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <h3 className="font-sports text-2xl uppercase tracking-widest text-slate-300 mb-6 flex items-center gap-2">
          <ClipboardList size={20} className="text-kelly-green" /> Scores Management
        </h3>
        {scores.length === 0 ? (
          <div className="text-center text-slate-500 p-12 border border-dashed border-slate-800 rounded-2xl bg-dark-surface/30">
            No scores reported yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-800 text-slate-400 uppercase tracking-wider text-xs">
                <tr>
                  <th className="p-4 font-bold">Round</th>
                  <th className="p-4 font-bold">Player</th>
                  <th className="p-4 font-bold">Score</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {scores.map(score => (
                  <tr key={score.score_id} className="hover:bg-dark-surface/50 transition-colors">
                    <td className="p-4 text-slate-300">{getRoundDetails(score.round_id)}</td>
                    <td className="p-4 font-bold">{getPlayerName(score.player_id, score.round_id)}</td>
                    <td className="p-4">
                      {editingId === score.score_id ? (
                        <input
                          type="number"
                          className="w-16 bg-dark-bg border border-slate-700 rounded px-2 py-1 text-white focus:border-kelly-green focus:outline-none text-center font-data"
                          value={scoreValue}
                          onChange={(e) => setScoreValue(e.target.value)}
                        />
                      ) : (
                        <span className="font-data font-bold text-kelly-green">{score.score}</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {editingId === score.score_id ? (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleSave(score.score_id)} className="inline-flex items-center gap-1 bg-kelly-green text-dark-bg px-3 py-1.5 rounded-lg font-bold hover:bg-green-500 transition-colors text-xs uppercase">
                            <Check size={14} /> Save
                          </button>
                          <button onClick={handleCancel} className="inline-flex items-center gap-1 bg-slate-700 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-slate-600 transition-colors text-xs uppercase">
                            <X size={14} /> Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleEdit(score)} className="inline-flex items-center gap-1 bg-slate-700 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-slate-600 transition-colors text-xs uppercase">
                            <Edit size={14} /> Edit
                          </button>
                          <button onClick={() => handleDelete(score.score_id)} className="inline-flex items-center gap-1 bg-red-500/10 text-red-500 px-3 py-1.5 rounded-lg font-bold hover:bg-red-500 hover:text-white transition-colors text-xs uppercase">
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h3 className="font-sports text-2xl uppercase tracking-widest text-slate-300 mb-6 flex items-center gap-2">
          <Edit size={20} className="text-kelly-green" /> Add New Score
        </h3>

        <div className="bg-dark-surface border border-slate-800 rounded-2xl p-6 shadow-xl">
          {scoreError && (
            <div className="bg-red-500/10 text-red-500 p-3 rounded-xl text-xs font-bold uppercase tracking-wider mb-4">
              {scoreError}
            </div>
          )}
          <form onSubmit={handleAddScore} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="scoreRound">Select Round *</label>
              <select
                id="scoreRound"
                value={newRoundId}
                onChange={(e) => {
                  setNewRoundId(e.target.value);
                  setScoreError(null);
                }}
                required
                className="w-full bg-dark-bg border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-kelly-green focus:outline-none transition-colors appearance-none"
              >
                <option value="">-- Choose a round --</option>
                {rounds.map(round => (
                  <option key={round.round_id} value={round.round_id}>
                    {round.name || 'Unnamed Round'} - {round.date ? new Date(round.date).toLocaleDateString('en-US', { timeZone: 'UTC' }) : 'No Date'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="scorePlayer">Select Player *</label>
              <select
                id="scorePlayer"
                value={newPlayerId}
                onChange={(e) => {
                  setNewPlayerId(e.target.value);
                  setScoreError(null);
                }}
                required
                className="w-full bg-dark-bg border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-kelly-green focus:outline-none transition-colors appearance-none"
              >
                <option value="">-- Choose a player --</option>
                {players.slice().sort((a, b) => {
                   const aName = a.name ? a.name.toLowerCase() : '';
                   const bName = b.name ? b.name.toLowerCase() : '';
                   return aName.localeCompare(bName);
                }).map(player => (
                  <option key={player.player_id} value={player.player_id}>
                    {formatDisplayName(player.name, players)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="scoreValue">Total Score *</label>
              <input
                type="number"
                id="scoreValue"
                min="0"
                value={newScoreValue}
                onChange={(e) => {
                  setNewScoreValue(e.target.value);
                  setScoreError(null);
                }}
                required
                className="w-full bg-dark-bg border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-kelly-green focus:outline-none transition-colors font-data text-xl text-center"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingScore}
              className={`w-full py-4 rounded-xl font-bold uppercase tracking-wider transition-colors mt-2 flex items-center justify-center gap-2 ${
                isSubmittingScore
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-kelly-green text-dark-bg hover:bg-green-500'
              }`}
            >
              {isSubmittingScore ? 'Submitting...' : 'Submit Score'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Admin;

function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [courseSize, setCourseSize] = useState(18);
  const [holes, setHoles] = useState(Array.from({ length: 18 }, (_, i) => ({ hole: i + 1, par: 2 })));

  const loadCourses = async () => {
    setCourses(await getCourses());
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleHoleParChange = (index, parValue) => {
    const newHoles = [...holes];
    newHoles[index].par = parseInt(parValue, 10) || 1;
    setHoles(newHoles);
  };

  const handleCourseSizeChange = (e) => {
    const size = parseInt(e.target.value, 10);
    setCourseSize(size);
    // When size changes, we generate a new holes array but try to preserve existing pars if possible
    setHoles(prevHoles => {
      return Array.from({ length: size }, (_, i) => {
        const existingHole = prevHoles.find(h => h.hole === i + 1);
        return existingHole ? existingHole : { hole: i + 1, par: 2 };
      });
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingId) {
      await updateCourse(editingId, { name, holes });
      setEditingId(null);
    } else {
      await addCourse({ name, holes });
    }

    setName('');
    setCourseSize(18);
    setHoles(Array.from({ length: 18 }, (_, i) => ({ hole: i + 1, par: 2 })));
    loadCourses();
  };

  const handleEdit = (course) => {
    setEditingId(course.course_id);
    setName(course.name);
    const loadedHoles = course.holes || Array.from({ length: 18 }, (_, i) => ({ hole: i + 1, par: 2 }));
    setHoles(loadedHoles);
    setCourseSize(loadedHoles.length);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      await deleteCourse(id);
      loadCourses();
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName('');
    setCourseSize(18);
    setHoles(Array.from({ length: 18 }, (_, i) => ({ hole: i + 1, par: 2 })));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <h3 className="font-sports text-2xl uppercase tracking-widest text-slate-300 mb-6 flex items-center gap-2">
          <MapIcon size={20} className="text-kelly-green" /> Courses List
        </h3>

        {courses.length === 0 ? (
          <div className="text-center text-slate-500 p-12 border border-dashed border-slate-800 rounded-2xl bg-dark-surface/30">
            No courses available.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-800 text-slate-400 uppercase tracking-wider text-xs">
                <tr>
                  <th className="p-4 font-bold">Course Name</th>
                  <th className="p-4 font-bold text-center">Total Par</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {courses.map(course => (
                  <tr key={course.course_id} className="hover:bg-dark-surface/50 transition-colors">
                    <td className="p-4 font-bold">{course.name}</td>
                    <td className="p-4 text-center font-data font-bold text-kelly-green">
                      {course.holes ? course.holes.reduce((sum, h) => sum + h.par, 0) : 'N/A'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(course)} className="inline-flex items-center gap-1 bg-slate-700 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-slate-600 transition-colors text-xs uppercase">
                          <Edit size={14} /> Edit
                        </button>
                        <button onClick={() => handleDelete(course.course_id)} className="inline-flex items-center gap-1 bg-red-500/10 text-red-500 px-3 py-1.5 rounded-lg font-bold hover:bg-red-500 hover:text-white transition-colors text-xs uppercase">
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h3 className="font-sports text-2xl uppercase tracking-widest text-slate-300 mb-6 flex items-center gap-2">
          <Edit size={20} className="text-kelly-green" /> {editingId ? 'Edit Course' : 'Add New Course'}
        </h3>

        <div className="bg-dark-surface border border-slate-800 rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="courseName">Course Name *</label>
              <input
                type="text"
                id="courseName"
                className="w-full bg-dark-bg border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-kelly-green focus:outline-none transition-colors"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="courseSize">Number of Holes</label>
              <select
                id="courseSize"
                value={courseSize}
                onChange={handleCourseSizeChange}
                className="w-full bg-dark-bg border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-kelly-green focus:outline-none transition-colors appearance-none"
              >
                <option value={9}>9 Holes</option>
                <option value={18}>18 Holes</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hole Pars</label>
              <div className="grid grid-cols-3 gap-3 bg-dark-bg p-3 rounded-xl border border-slate-800 max-h-60 overflow-y-auto no-scrollbar">
                {holes.map((holeObj, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <label htmlFor={`hole-${holeObj.hole}`} className="text-[10px] text-slate-500 font-bold mb-1">H{holeObj.hole}</label>
                    <input
                      type="number"
                      id={`hole-${holeObj.hole}`}
                      min="1"
                      className="w-full bg-dark-surface border border-slate-700 rounded-lg px-2 py-2 text-white focus:border-kelly-green focus:outline-none transition-colors text-center font-data"
                      value={holeObj.par}
                      onChange={(e) => handleHoleParChange(index, e.target.value)}
                      required
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-2 flex flex-col gap-3">
              <button type="submit" className="w-full bg-kelly-green text-dark-bg py-3 rounded-xl font-bold uppercase tracking-wider hover:bg-green-500 transition-colors flex items-center justify-center gap-2">
                <Check size={16} /> {editingId ? 'Update Course' : 'Add Course'}
              </button>
              {editingId && (
                <button type="button" onClick={cancelEdit} className="w-full bg-slate-700 text-white py-3 rounded-xl font-bold uppercase tracking-wider hover:bg-slate-600 transition-colors flex items-center justify-center gap-2">
                  <X size={16} /> Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
