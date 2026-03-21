import { v4 as uuidv4 } from 'uuid';
import { db } from './firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where
} from 'firebase/firestore';

const PLAYERS_KEY = 'putting_league_players';
const ROUNDS_KEY = 'putting_league_rounds';
const SCORES_KEY = 'putting_league_scores';
const COURSES_KEY = 'putting_league_courses';

// --- Courses ---
export const getCourse = async (course_id) => {
  const courseDoc = await getDocs(query(collection(db, COURSES_KEY), where("course_id", "==", course_id)));
  if (!courseDoc.empty) {
    return courseDoc.docs[0].data();
  }
  return null;
};

export const getCourses = async () => {
  const querySnapshot = await getDocs(collection(db, COURSES_KEY));
  const courses = querySnapshot.docs.map(doc => doc.data());

  if (courses.length === 0) {
    const defaultCourse = {
      course_id: uuidv4(),
      name: 'Putting World',
      holes: Array.from({ length: 18 }, (_, i) => ({ hole: i + 1, par: 2 }))
    };
    const dobsonRanch = {
      course_id: uuidv4(),
      name: 'Dobson Ranch',
      holes: [
        { hole: 1, par: 2 },
        { hole: 2, par: 2 },
        { hole: 3, par: 3 },
        { hole: 4, par: 2 },
        { hole: 5, par: 3 },
        { hole: 6, par: 2 },
        { hole: 7, par: 3 },
        { hole: 8, par: 2 },
        { hole: 9, par: 3 }
      ]
    };

    await setDoc(doc(db, COURSES_KEY, defaultCourse.course_id), defaultCourse);
    await setDoc(doc(db, COURSES_KEY, dobsonRanch.course_id), dobsonRanch);

    return [defaultCourse, dobsonRanch];
  }
  return courses;
};

export const addCourse = async (course) => {
  const course_id = uuidv4();
  const newCourse = {
    course_id,
    ...course
  };
  await setDoc(doc(db, COURSES_KEY, course_id), newCourse);
  return newCourse;
};

export const updateCourse = async (course_id, updatedData) => {
  const courseRef = doc(db, COURSES_KEY, course_id);
  await updateDoc(courseRef, updatedData);
};

export const deleteCourse = async (course_id) => {
  await deleteDoc(doc(db, COURSES_KEY, course_id));
};

// --- Players ---
export const getPlayers = async () => {
  const querySnapshot = await getDocs(collection(db, PLAYERS_KEY));
  return querySnapshot.docs.map(doc => doc.data());
};

export const addPlayer = async (player) => {
  const player_id = player.uid || uuidv4();
  const newPlayer = {
    player_id,
    ...player
  };
  await setDoc(doc(db, PLAYERS_KEY, player_id), newPlayer);
  return newPlayer;
};

export const updatePlayer = async (player_id, updatedData) => {
  const playerRef = doc(db, PLAYERS_KEY, player_id);
  await updateDoc(playerRef, updatedData);
};

export const deletePlayer = async (player_id) => {
  await deleteDoc(doc(db, PLAYERS_KEY, player_id));

  // Also delete associated scores
  const scoresQuery = query(collection(db, SCORES_KEY), where("player_id", "==", player_id));
  const querySnapshot = await getDocs(scoresQuery);
  const deletePromises = querySnapshot.docs.map(docSnapshot => deleteDoc(doc(db, SCORES_KEY, docSnapshot.id)));
  await Promise.all(deletePromises);
};

// --- Rounds ---
export const getRounds = async () => {
  const querySnapshot = await getDocs(collection(db, ROUNDS_KEY));
  return querySnapshot.docs.map(doc => doc.data());
};

export const addRound = async (round) => {
  const round_id = uuidv4();
  const newRound = {
    round_id,
    status: 'Active', // Default status
    ...round
  };
  await setDoc(doc(db, ROUNDS_KEY, round_id), newRound);
  return newRound;
};

export const updateRoundStatus = async (round_id, status) => {
  const roundRef = doc(db, ROUNDS_KEY, round_id);
  await updateDoc(roundRef, { status });
};

export const updateRoundSeason = async (round_id, season) => {
  const roundRef = doc(db, ROUNDS_KEY, round_id);
  await updateDoc(roundRef, { season });
};

export const deleteRound = async (round_id) => {
  await deleteDoc(doc(db, ROUNDS_KEY, round_id));

  // Also delete associated scores
  const scoresQuery = query(collection(db, SCORES_KEY), where("round_id", "==", round_id));
  const querySnapshot = await getDocs(scoresQuery);
  const deletePromises = querySnapshot.docs.map(docSnapshot => deleteDoc(doc(db, SCORES_KEY, docSnapshot.id)));
  await Promise.all(deletePromises);
};

// --- Scores ---
export const getScores = async () => {
  const querySnapshot = await getDocs(collection(db, SCORES_KEY));
  return querySnapshot.docs.map(doc => doc.data());
};

export const addScore = async (score) => {
  const score_id = uuidv4();
  const newScore = {
    score_id,
    timestamp: new Date().toISOString(),
    ...score
  };
  await setDoc(doc(db, SCORES_KEY, score_id), newScore);
  return newScore;
};

export const getScoresForRound = async (round_id) => {
  const scoresQuery = query(collection(db, SCORES_KEY), where("round_id", "==", round_id));
  const querySnapshot = await getDocs(scoresQuery);
  return querySnapshot.docs.map(doc => doc.data());
};

export const getScoresForPlayer = async (player_id) => {
  const scoresQuery = query(collection(db, SCORES_KEY), where("player_id", "==", player_id));
  const querySnapshot = await getDocs(scoresQuery);
  return querySnapshot.docs.map(doc => doc.data());
};

export const updateScore = async (score_id, scoreValue) => {
  const scoreRef = doc(db, SCORES_KEY, score_id);
  await updateDoc(scoreRef, { score: scoreValue });
};

export const deleteScore = async (score_id) => {
  await deleteDoc(doc(db, SCORES_KEY, score_id));
};
