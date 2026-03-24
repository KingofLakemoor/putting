import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Users, CalendarDays, ClipboardList, Map, UserCog, Edit, Trash2, Check, X } from 'lucide-react';
import { getPlayers, addPlayer, updatePlayer, deletePlayer, getRounds, addRound, updateRoundStatus, updateRoundSeason, deleteRound, getScores, updateScore, deleteScore, getCourses, addCourse, updateCourse, deleteCourse, getCoordinators, addCoordinator, removeCoordinator } from '../db';
import { useAuth } from '../contexts/AuthContext';

function Admin() {
  const [activeTab, setActiveTab] = useState('players');
  const { currentUser, isAdmin, isCoordinator } = useAuth();

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
    { id: 'rounds', label: 'Manage Rounds', icon: CalendarDays },
    { id: 'scores', label: 'Manage Scores', icon: ClipboardList },
  ];
  if (isAdmin) {
    tabs.push({ id: 'courses', label: 'Manage Courses', icon: Map });
    tabs.push({ id: 'coordinators', label: 'Manage Coordinators', icon: UserCog });
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white p-4 md:p-8 font-sans">
      <div className="mb-8 border-b border-slate-800 pb-4">
        <h2 className="font-sports text-4xl uppercase tracking-tighter text-white flex items-center gap-3">
          <ShieldAlert className="text-kelly-green" size={32} /> Admin Dashboard
        </h2>
        <p className="font-data text-[10px] text-slate-500 uppercase tracking-[0.2em]">System Management</p>
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
        {activeTab === 'rounds' && <AdminRounds />}
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

  const loadData = async () => {
    setCoordinators(await getCoordinators());
    setPlayers(await getPlayers());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddCoordinator = async (e) => {
    e.preventDefault();
    if (!selectedPlayerId) return;

    const player = players.find(p => p.player_id === selectedPlayerId);
    if (!player || !player.uid) {
      alert("This player does not have an associated user account (UID) and cannot be made a coordinator.");
      return;
    }

    try {
      await addCoordinator(player.uid, player.email || null, player.name);
      setSelectedPlayerId('');
      loadData();
    } catch (error) {
      console.error("Error adding coordinator:", error);
      alert("Failed to add coordinator.");
    }
  };

  const handleRemoveCoordinator = async (uid) => {
    if (window.confirm("Are you sure you want to remove this coordinator?")) {
      try {
        await removeCoordinator(uid);
        loadData();
      } catch (error) {
        console.error("Error removing coordinator:", error);
        alert("Failed to remove coordinator.");
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                onChange={(e) => setSelectedPlayerId(e.target.value)}
                required
                className="w-full bg-dark-bg border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-kelly-green focus:outline-none transition-colors appearance-none"
              >
                <option value="">-- Select a player --</option>
                {players.filter(p => p.uid && !coordinators.some(c => c.uid === p.uid)).map(player => (
                  <option key={player.player_id} value={player.player_id}>
                    {player.name} ({player.email || 'No email'})
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
  const [editingId, setEditingId] = useState(null);

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

    if (editingId) {
      await updatePlayer(editingId, { name: formattedName, email });
      setEditingId(null);
    } else {
      await addPlayer({ name: formattedName, email });
    }

    setFirstName('');
    setLastName('');
    setEmail('');
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
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <h3 className="font-sports text-2xl uppercase tracking-widest text-slate-300 mb-6 flex items-center gap-2">
          <Users size={20} className="text-kelly-green" /> Players List
        </h3>

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
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {players.map(player => (
                  <tr key={player.player_id} className="hover:bg-dark-surface/50 transition-colors">
                    <td className="p-4 font-bold">{player.name}</td>
                    <td className="p-4 text-slate-300">{player.email}</td>
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

function AdminRounds() {
  const [rounds, setRounds] = useState([]);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [courseId, setCourseId] = useState('');
  const [courses, setCourses] = useState([]);
  const [showArchived, setShowArchived] = useState(false);

  const loadData = async () => {
    setRounds(await getRounds());
    setCourses(await getCourses());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !courseId) return;

    const selectedCourse = courses.find(c => c.course_id === courseId);

    const newRound = {
      name,
      date,
      location: selectedCourse ? selectedCourse.name : 'Unknown Location',
      course_id: courseId
    };

    await addRound(newRound);

    // Reset form
    setName('');
    setDate('');
    setCourseId('');
    loadData();
  };

  const handleStatusChange = async (id, newStatus) => {
    await updateRoundStatus(id, newStatus);
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

  const filteredRounds = rounds.filter(round =>
    showArchived ? round.status === 'Archived' : round.status !== 'Archived'
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-sports text-2xl uppercase tracking-widest text-slate-300 flex items-center gap-2">
            <CalendarDays size={20} className="text-kelly-green" /> {showArchived ? 'Archived Rounds' : 'Rounds Management'}
          </h3>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
          >
            {showArchived ? 'View Active & Completed' : 'View Archived Rounds'}
          </button>
        </div>

        {filteredRounds.length === 0 ? (
          <div className="text-center text-slate-500 p-12 border border-dashed border-slate-800 rounded-2xl bg-dark-surface/30">
            {showArchived ? 'No archived rounds.' : 'No active or completed rounds added yet.'}
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
                    <td className="p-4 font-bold">{round.name || '-'}</td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-white">{new Date(round.date).toLocaleDateString('en-US', { timeZone: 'UTC' })}</span>
                        <span className="text-xs text-slate-400">{round.location}</span>
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
                          onChange={(e) => handleStatusChange(round.round_id, e.target.value)}
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
          <Edit size={20} className="text-kelly-green" /> Create New Round
        </h3>
        <div className="bg-dark-surface border border-slate-800 rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="name">Round Name</label>
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

            <button type="submit" className="w-full bg-kelly-green text-dark-bg py-3 rounded-xl font-bold uppercase tracking-wider hover:bg-green-500 transition-colors mt-2 flex items-center justify-center gap-2">
              <Check size={16} /> Create Round
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

  const getPlayerName = (id) => {
    const player = players.find(p => p.player_id === id);
    return player ? player.name : 'Unknown Player';
  };

  const getRoundDetails = (id) => {
    const round = rounds.find(r => r.round_id === id);
    if (!round) return 'Unknown Round';

    const dateStr = new Date(round.date).toLocaleDateString('en-US', { timeZone: 'UTC' });
    return round.name ? `${round.name} - ${dateStr} - ${round.location}` : `${dateStr} - ${round.location}`;
  };

  return (
    <div>
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
                  <td className="p-4 font-bold">{getPlayerName(score.player_id)}</td>
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
          <Map size={20} className="text-kelly-green" /> Courses List
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
