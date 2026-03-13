import React, { useState, useEffect } from 'react';
import { getPlayers, addPlayer, updatePlayer, deletePlayer, getRounds, updateRoundStatus, updateRoundSeason, deleteRound, getScores, updateScore, deleteScore, getCourses, addCourse, updateCourse, deleteCourse } from '../db';

function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('players');

  useEffect(() => {
    const loggedIn = localStorage.getItem('putting_league_admin_logged_in');
    if (loggedIn === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    // Simple mock password
    if (password === 'admin') {
      localStorage.setItem('putting_league_admin_logged_in', 'true');
      setIsLoggedIn(true);
    } else {
      alert('Incorrect password');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('putting_league_admin_logged_in');
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="page-container">
        <h2>Admin Login</h2>
        <div className="form-section" style={{ maxWidth: '400px', margin: '0 auto' }}>
          <form onSubmit={handleLogin} className="add-form">
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
            <button type="submit" className="btn-primary">Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container admin-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Admin Dashboard</h2>
        <button onClick={handleLogout} className="btn-secondary">Logout</button>
      </div>

      <div className="admin-tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #ecf0f1', paddingBottom: '1rem' }}>
        <button
          className={activeTab === 'players' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('players')}
        >
          Manage Players
        </button>
        <button
          className={activeTab === 'rounds' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('rounds')}
        >
          Manage Rounds
        </button>
        <button
          className={activeTab === 'scores' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('scores')}
        >
          Manage Scores
        </button>
        <button
          className={activeTab === 'courses' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('courses')}
        >
          Manage Courses
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'players' && <AdminPlayers />}
        {activeTab === 'rounds' && <AdminRounds />}
        {activeTab === 'scores' && <AdminScores />}
        {activeTab === 'courses' && <AdminCourses />}
      </div>
    </div>
  );
}

function AdminPlayers() {
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState('');
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
    if (!name.trim()) return;

    if (editingId) {
      await updatePlayer(editingId, { name, email });
      setEditingId(null);
    } else {
      await addPlayer({ name, email });
    }

    setName('');
    setEmail('');
    loadPlayers();
  };

  const handleEdit = (player) => {
    setEditingId(player.player_id);
    setName(player.name);
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
    setName('');
    setEmail('');
  };

  return (
    <div className="layout-grid">
      <div className="list-section">
        <h3>Players List</h3>
        {players.length === 0 ? (
          <p>No players added yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.map(player => (
                <tr key={player.player_id}>
                  <td>{player.name}</td>
                  <td>{player.email}</td>
                  <td>
                    <button onClick={() => handleEdit(player)} className="btn-secondary" style={{ marginRight: '0.5rem', padding: '0.5rem 1rem' }}>Edit</button>
                    <button onClick={() => handleDelete(player.player_id)} className="btn-secondary" style={{ backgroundColor: '#e74c3c', color: 'white', padding: '0.5rem 1rem' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="form-section">
        <h3>{editingId ? 'Edit Player' : 'Add New Player'}</h3>
        <form onSubmit={handleSubmit} className="add-form">
          <div className="form-group">
            <label htmlFor="playerName">Full Name *</label>
            <input
              type="text"
              id="playerName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="playerEmail">Email</label>
            <input
              type="email"
              id="playerEmail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ marginBottom: '1rem' }}>
            {editingId ? 'Update Player' : 'Add Player'}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="btn-secondary" style={{ width: '100%' }}>Cancel Edit</button>
          )}
        </form>
      </div>
    </div>
  );
}

function AdminRounds() {
  const [rounds, setRounds] = useState([]);

  const loadRounds = async () => {
    setRounds(await getRounds());
  };

  useEffect(() => {
    loadRounds();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    await updateRoundStatus(id, newStatus);
    loadRounds();
  };

  const handleSeasonChange = async (id, newSeason) => {
    await updateRoundSeason(id, newSeason);
    loadRounds();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this round? This will also delete all associated scores.")) {
      await deleteRound(id);
      loadRounds();
    }
  };

  return (
    <div className="list-section">
      <h3>Rounds / Events Management</h3>
      {rounds.length === 0 ? (
        <p>No rounds added yet.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Location</th>
              <th>Season</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rounds.map(round => (
              <tr key={round.round_id}>
                <td>{new Date(round.date).toLocaleDateString('en-US', { timeZone: 'UTC' })}</td>
                <td>{round.location}</td>
                <td>
                  <input
                    type="text"
                    defaultValue={round.season || ''}
                    onBlur={(e) => handleSeasonChange(round.round_id, e.target.value)}
                    placeholder="e.g. Summer 2024"
                    style={{ padding: '0.25rem', borderRadius: '4px', border: '1px solid #ced4da', width: '120px' }}
                  />
                </td>
                <td>
                  <select
                    value={round.status}
                    onChange={(e) => handleStatusChange(round.round_id, e.target.value)}
                    style={{ padding: '0.25rem', borderRadius: '4px', border: '1px solid #ced4da' }}
                  >
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Archived">Archived</option>
                  </select>
                </td>
                <td>
                  <button onClick={() => handleDelete(round.round_id)} className="btn-secondary" style={{ backgroundColor: '#e74c3c', color: 'white', padding: '0.5rem 1rem' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
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
    return round ? `${new Date(round.date).toLocaleDateString('en-US', { timeZone: 'UTC' })} - ${round.location}` : 'Unknown Round';
  };

  return (
    <div className="list-section">
      <h3>Scores Management</h3>
      {scores.length === 0 ? (
        <p>No scores reported yet.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Round</th>
              <th>Player</th>
              <th>Score</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {scores.map(score => (
              <tr key={score.score_id}>
                <td>{getRoundDetails(score.round_id)}</td>
                <td>{getPlayerName(score.player_id)}</td>
                <td>
                  {editingId === score.score_id ? (
                    <input
                      type="number"
                      value={scoreValue}
                      onChange={(e) => setScoreValue(e.target.value)}
                      style={{ padding: '0.25rem', width: '60px' }}
                    />
                  ) : (
                    score.score
                  )}
                </td>
                <td>
                  {editingId === score.score_id ? (
                    <>
                      <button onClick={() => handleSave(score.score_id)} className="btn-primary" style={{ marginRight: '0.5rem', padding: '0.5rem 1rem', width: 'auto' }}>Save</button>
                      <button onClick={handleCancel} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleEdit(score)} className="btn-secondary" style={{ marginRight: '0.5rem', padding: '0.5rem 1rem' }}>Edit</button>
                      <button onClick={() => handleDelete(score.score_id)} className="btn-secondary" style={{ backgroundColor: '#e74c3c', color: 'white', padding: '0.5rem 1rem' }}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

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
    <div className="layout-grid">
      <div className="list-section">
        <h3>Courses List</h3>
        {courses.length === 0 ? (
          <p>No courses available.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Course Name</th>
                <th>Total Par</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(course => (
                <tr key={course.course_id}>
                  <td>{course.name}</td>
                  <td>{course.holes ? course.holes.reduce((sum, h) => sum + h.par, 0) : 'N/A'}</td>
                  <td>
                    <button onClick={() => handleEdit(course)} className="btn-secondary" style={{ marginRight: '0.5rem', padding: '0.5rem 1rem' }}>Edit</button>
                    <button onClick={() => handleDelete(course.course_id)} className="btn-secondary" style={{ backgroundColor: '#e74c3c', color: 'white', padding: '0.5rem 1rem' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="form-section">
        <h3>{editingId ? 'Edit Course' : 'Add New Course'}</h3>
        <form onSubmit={handleSubmit} className="add-form">
          <div className="form-group">
            <label htmlFor="courseName">Course Name *</label>
            <input
              type="text"
              id="courseName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="courseSize">Number of Holes</label>
            <select
              id="courseSize"
              value={courseSize}
              onChange={handleCourseSizeChange}
            >
              <option value={9}>9 Holes</option>
              <option value={18}>18 Holes</option>
            </select>
          </div>

          <div className="form-group">
            <label>Hole Pars</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {holes.map((holeObj, index) => (
                <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <label htmlFor={`hole-${holeObj.hole}`} style={{ fontSize: '0.8rem', marginBottom: '2px' }}>Hole {holeObj.hole}</label>
                  <input
                    type="number"
                    id={`hole-${holeObj.hole}`}
                    min="1"
                    value={holeObj.par}
                    onChange={(e) => handleHoleParChange(index, e.target.value)}
                    style={{ width: '100%', padding: '0.25rem' }}
                    required
                  />
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ marginBottom: '1rem', marginTop: '1rem' }}>
            {editingId ? 'Update Course' : 'Add Course'}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="btn-secondary" style={{ width: '100%' }}>Cancel Edit</button>
          )}
        </form>
      </div>
    </div>
  );
}

export default Admin;
