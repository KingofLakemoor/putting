import { v4 as uuidv4 } from 'uuid';

const PLAYERS_KEY = 'putting_league_players';
const ROUNDS_KEY = 'putting_league_rounds';
const SCORES_KEY = 'putting_league_scores';

// Helper to get data from localStorage
const getData = (key) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

// Helper to save data to localStorage
const saveData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// --- Players ---
export const getPlayers = () => getData(PLAYERS_KEY);

export const addPlayer = (player) => {
  const players = getPlayers();
  const newPlayer = {
    player_id: uuidv4(),
    ...player
  };
  players.push(newPlayer);
  saveData(PLAYERS_KEY, players);
  return newPlayer;
};

export const updatePlayer = (player_id, updatedData) => {
  let players = getPlayers();
  players = players.map(player =>
    player.player_id === player_id ? { ...player, ...updatedData } : player
  );
  saveData(PLAYERS_KEY, players);
};

export const deletePlayer = (player_id) => {
  let players = getPlayers();
  players = players.filter(player => player.player_id !== player_id);
  saveData(PLAYERS_KEY, players);

  // Also delete associated scores
  let scores = getScores();
  scores = scores.filter(score => score.player_id !== player_id);
  saveData(SCORES_KEY, scores);
};

// --- Rounds ---
export const getRounds = () => getData(ROUNDS_KEY);

export const addRound = (round) => {
  const rounds = getRounds();
  const newRound = {
    round_id: uuidv4(),
    status: 'Active', // Default status
    ...round
  };
  rounds.push(newRound);
  saveData(ROUNDS_KEY, rounds);
  return newRound;
};

export const updateRoundStatus = (round_id, status) => {
  let rounds = getRounds();
  rounds = rounds.map(round =>
    round.round_id === round_id ? { ...round, status } : round
  );
  saveData(ROUNDS_KEY, rounds);
};

export const deleteRound = (round_id) => {
  let rounds = getRounds();
  rounds = rounds.filter(round => round.round_id !== round_id);
  saveData(ROUNDS_KEY, rounds);

  // Also delete associated scores
  let scores = getScores();
  scores = scores.filter(score => score.round_id !== round_id);
  saveData(SCORES_KEY, scores);
};

// --- Scores ---
export const getScores = () => getData(SCORES_KEY);

export const addScore = (score) => {
  const scores = getScores();
  const newScore = {
    score_id: uuidv4(),
    timestamp: new Date().toISOString(),
    ...score
  };
  scores.push(newScore);
  saveData(SCORES_KEY, scores);
  return newScore;
};

export const getScoresForRound = (round_id) => {
  const scores = getScores();
  return scores.filter(score => score.round_id === round_id);
};

export const getScoresForPlayer = (player_id) => {
  const scores = getScores();
  return scores.filter(score => score.player_id === player_id);
};

export const updateScore = (score_id, scoreValue) => {
  let scores = getScores();
  scores = scores.map(score =>
    score.score_id === score_id ? { ...score, score: scoreValue } : score
  );
  saveData(SCORES_KEY, scores);
};

export const deleteScore = (score_id) => {
  let scores = getScores();
  scores = scores.filter(score => score.score_id !== score_id);
  saveData(SCORES_KEY, scores);
};
