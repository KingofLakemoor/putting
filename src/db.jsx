import { v4 as uuidv4 } from "uuid";
import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

const PLAYERS_KEY = "putting_league_players";
const ROUNDS_KEY = "putting_league_rounds";
const SCORES_KEY = "putting_league_scores";
const COURSES_KEY = "putting_league_courses";
const COORDINATORS_KEY = "putting_league_coordinators";
const SETTINGS_KEY = "putting_league_settings";
const CUP_POINTS_KEY = "putting_league_cup_points";
const MATCHUPS_KEY = "putting_league_matchups";

// --- Settings ---
export const getSettings = async () => {
  const settingsDoc = await getDocs(
    query(collection(db, SETTINGS_KEY), where("__name__", "==", "global")),
  );
  if (!settingsDoc.empty) {
    return settingsDoc.docs[0].data();
  }
  return { live_season: null, archived_seasons: [], cup_finale_season: null };
};

export const updateLiveSeason = async (season) => {
  const settingsRef = doc(db, SETTINGS_KEY, "global");
  await setDoc(settingsRef, { live_season: season }, { merge: true });
};

export const updateCupFinaleSeason = async (season) => {
  const settingsRef = doc(db, SETTINGS_KEY, "global");
  await setDoc(settingsRef, { cup_finale_season: season }, { merge: true });
};

export const addArchivedSeason = async (season) => {
  const settingsRef = doc(db, SETTINGS_KEY, "global");
  const currentSettings = await getSettings();
  const archived = currentSettings.archived_seasons || [];
  if (!archived.includes(season)) {
    archived.push(season);
    await setDoc(settingsRef, { archived_seasons: archived }, { merge: true });
  }
};

export const removeArchivedSeason = async (season) => {
  const settingsRef = doc(db, SETTINGS_KEY, "global");
  const currentSettings = await getSettings();
  const archived = currentSettings.archived_seasons || [];
  const updatedArchived = archived.filter((s) => s !== season);
  await setDoc(
    settingsRef,
    { archived_seasons: updatedArchived },
    { merge: true },
  );
};

export const getActualPlayerId = async (uid_or_player_id) => {
  if (!uid_or_player_id) return null;
  const q = query(
    collection(db, PLAYERS_KEY),
    where("uid", "==", uid_or_player_id),
  );
  const snapshot = await getDocs(q);
  if (!snapshot.empty) return snapshot.docs[0].data().player_id;

  // Fallback: check if uid is already a player_id
  try {
    const pRef = doc(db, PLAYERS_KEY, uid_or_player_id);
    const pSnap = await getDoc(pRef);
    if (pSnap.exists()) return pSnap.data().player_id;
  } catch (e) {
    // Ignore invalid doc id errors
  }

  return uid_or_player_id;
};

// --- Coordinators ---
export const getCoordinators = async () => {
  const querySnapshot = await getDocs(collection(db, COORDINATORS_KEY));
  return querySnapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
};

export const addCoordinator = async (uid, email, name) => {
  await setDoc(doc(db, COORDINATORS_KEY, uid), { email, name });
};

export const removeCoordinator = async (uid) => {
  await deleteDoc(doc(db, COORDINATORS_KEY, uid));
};

// --- Courses ---
export const getCourse = async (course_id) => {
  const courseDoc = await getDocs(
    query(collection(db, COURSES_KEY), where("course_id", "==", course_id)),
  );
  if (!courseDoc.empty) {
    return courseDoc.docs[0].data();
  }
  return null;
};

export const createActiveRound = async (
  userId,
  userName,
  eventRoundId = null,
  eventRoundName = null,
  eventCourseId = null,
) => {
  const actualId = await getActualPlayerId(userId);
  const round_id = uuidv4();
  const newRound = {
    round_id,
    player_id: actualId,
    player_name: userName,
    status: "active",
    current_hole: 1,
    scores: {},
    created_at: serverTimestamp(),
    venue: "Dobson Ranch",
    ...(eventRoundId && { event_round_id: eventRoundId }),
    ...(eventRoundName && { event_round_name: eventRoundName }),
    ...(eventCourseId && { course_id: eventCourseId }),
  };
  await setDoc(doc(db, ROUNDS_KEY, round_id), newRound);
  return newRound;
};

export const getActiveRoundForUser = async (userId) => {
  const actualId = await getActualPlayerId(userId);

  const roundQuery = query(
    collection(db, ROUNDS_KEY),
    where("status", "==", "active"),
    where("player_id", "==", actualId),
  );
  const querySnapshot = await getDocs(roundQuery);

  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].data();
  }
  return null;
};

export const updateRoundScore = async (
  round_id,
  user_id,
  hole_index,
  score,
) => {
  // Update the rounds document for the current user_id and hole_index
  // Using user_id as a key in a map
  const roundRef = doc(db, ROUNDS_KEY, round_id);
  const dataToUpdate = {};
  dataToUpdate[`scores.${user_id}.${hole_index}`] = score;

  try {
    await updateDoc(roundRef, dataToUpdate);
  } catch (e) {
    // Document might not have the fields set yet, or we need to ensure the structure exists
    // Actually, dot notation allows updating nested fields if the parent exists
    console.error(
      "Failed to update per-hole score directly on round, setting with merge",
      e,
    );
    await setDoc(
      roundRef,
      {
        scores: {
          [user_id]: {
            [hole_index]: score,
          },
        },
      },
      { merge: true },
    );
  }
};

export const getCourses = async () => {
  const querySnapshot = await getDocs(collection(db, COURSES_KEY));
  const courses = querySnapshot.docs.map((doc) => doc.data());

  if (courses.length === 0) {
    const defaultCourse = {
      course_id: uuidv4(),
      name: "Putting World",
      holes: Array.from({ length: 18 }, (_, i) => ({ hole: i + 1, par: 2 })),
    };
    const dobsonRanch = {
      course_id: uuidv4(),
      name: "Dobson Ranch",
      holes: [
        { hole: 1, par: 2 },
        { hole: 2, par: 2 },
        { hole: 3, par: 3 },
        { hole: 4, par: 2 },
        { hole: 5, par: 3 },
        { hole: 6, par: 2 },
        { hole: 7, par: 3 },
        { hole: 8, par: 2 },
        { hole: 9, par: 3 },
      ],
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
    ...course,
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
  return querySnapshot.docs.map((doc) => doc.data());
};

export const addPlayer = async (player) => {
  const player_id = player.uid || uuidv4();
  const newPlayer = {
    player_id,
    ...player,
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
  const scoresQuery = query(
    collection(db, SCORES_KEY),
    where("player_id", "==", player_id),
  );
  const querySnapshot = await getDocs(scoresQuery);
  const deletePromises = querySnapshot.docs.map((docSnapshot) =>
    deleteDoc(doc(db, SCORES_KEY, docSnapshot.id)),
  );
  await Promise.all(deletePromises);
};

// --- Rounds ---
export const getRounds = async () => {
  const querySnapshot = await getDocs(collection(db, ROUNDS_KEY));
  const rounds = querySnapshot.docs.map((doc) => doc.data());
  return rounds.sort((a, b) => {
    const dateA = new Date(a.date || 0).getTime();
    const dateB = new Date(b.date || 0).getTime();
    if (dateA !== dateB) {
      return dateB - dateA; // Date descending
    }
    // Date is the same, sort by name ascending
    const nameA = a.name || "";
    const nameB = b.name || "";
    return nameA.localeCompare(nameB);
  });
};

export const getRound = async (round_id) => {
  const roundDoc = await getDocs(
    query(collection(db, ROUNDS_KEY), where("round_id", "==", round_id)),
  );
  if (!roundDoc.empty) {
    return roundDoc.docs[0].data();
  }
  return null;
};

export const addRound = async (round) => {
  const round_id = uuidv4();
  const newRound = {
    round_id,
    status: "Active", // Default status
    round_format: round.round_format || "Open",
    ...(round.cut_line && { cut_line: round.cut_line }),
    ...(round.number_of_rounds && { number_of_rounds: round.number_of_rounds }),
    ...round,
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
  const scoresQuery = query(
    collection(db, SCORES_KEY),
    where("round_id", "==", round_id),
  );
  const querySnapshot = await getDocs(scoresQuery);
  const deletePromises = querySnapshot.docs.map((docSnapshot) =>
    deleteDoc(doc(db, SCORES_KEY, docSnapshot.id)),
  );
  await Promise.all(deletePromises);
};

// --- Matchups ---
export const getMatchupsForEvent = async (event_id) => {
  const querySnapshot = await getDocs(
    query(collection(db, MATCHUPS_KEY), where("event_id", "==", event_id)),
  );
  return querySnapshot.docs.map((doc) => doc.data());
};

export const getMatchupsForRound = async (event_round_id) => {
  const querySnapshot = await getDocs(
    query(
      collection(db, MATCHUPS_KEY),
      where("event_round_id", "==", event_round_id),
    ),
  );
  return querySnapshot.docs.map((doc) => doc.data());
};

export const addMatchup = async (matchup) => {
  const matchup_id = uuidv4();
  const newMatchup = {
    matchup_id,
    timestamp: new Date().toISOString(),
    ...matchup,
  };
  await setDoc(doc(db, MATCHUPS_KEY, matchup_id), newMatchup);
  return newMatchup;
};

export const saveMatchupsForRound = async (
  event_round_id,
  event_id,
  pairings,
) => {
  const promises = pairings.map((p) =>
    addMatchup({
      event_round_id,
      event_id,
      player1_id: p.player1_id,
      player2_id: p.player2_id,
    }),
  );
  await Promise.all(promises);
};

// --- Scores ---
export const getScores = async () => {
  const querySnapshot = await getDocs(collection(db, SCORES_KEY));
  return querySnapshot.docs.map((doc) => doc.data());
};

export const addScore = async (score, customId = null) => {
  const score_id = customId || uuidv4();
  const newScore = {
    score_id,
    timestamp: new Date().toISOString(),
    ...score,
  };
  await setDoc(doc(db, SCORES_KEY, score_id), newScore);
  return newScore;
};

export const getScoresForRound = async (round_id) => {
  const scoresQuery = query(
    collection(db, SCORES_KEY),
    where("round_id", "==", round_id),
  );
  const querySnapshot = await getDocs(scoresQuery);
  return querySnapshot.docs.map((doc) => doc.data());
};

export const getScoresForPlayer = async (player_id) => {
  const actualId = await getActualPlayerId(player_id);

  // Due to backwards compatibility, some scores might be saved with the raw UID instead of the player_id
  const uidScoresQuery = query(
    collection(db, SCORES_KEY),
    where("player_id", "==", player_id),
  );
  const uidQuerySnapshot = await getDocs(uidScoresQuery);
  let scores = uidQuerySnapshot.docs.map((doc) => doc.data());

  if (actualId !== player_id) {
    const actualIdScoresQuery = query(
      collection(db, SCORES_KEY),
      where("player_id", "==", actualId),
    );
    const actualIdQuerySnapshot = await getDocs(actualIdScoresQuery);
    scores = [
      ...scores,
      ...actualIdQuerySnapshot.docs.map((doc) => doc.data()),
    ];

    // Deduplicate scores
    const uniqueScoresMap = new Map();
    scores.forEach((s) => uniqueScoresMap.set(s.score_id, s));
    scores = Array.from(uniqueScoresMap.values());
  }

  return scores;
};

export const updateScore = async (score_id, scoreValue) => {
  const scoreRef = doc(db, SCORES_KEY, score_id);
  if (scoreValue === "DNF") {
    await updateDoc(scoreRef, { status: "DNF" });
  } else {
    await updateDoc(scoreRef, { score: scoreValue });
  }
};

export const deleteScore = async (score_id) => {
  await deleteDoc(doc(db, SCORES_KEY, score_id));
};

// --- 602 Cup Points ---
export const getCupPoints = async () => {
  const querySnapshot = await getDocs(collection(db, CUP_POINTS_KEY));
  return querySnapshot.docs.map((doc) => doc.data());
};

export const addCupPoints = async (pointsData) => {
  const points_id = uuidv4();
  const newPoints = {
    points_id,
    timestamp: new Date().toISOString(),
    ...pointsData,
  };
  await setDoc(doc(db, CUP_POINTS_KEY, points_id), newPoints);
  return newPoints;
};

export const deleteCupPointsForEvent = async (event_id) => {
  const q = query(
    collection(db, CUP_POINTS_KEY),
    where("event_id", "==", event_id),
  );
  const querySnapshot = await getDocs(q);
  const deletePromises = querySnapshot.docs.map((docSnapshot) =>
    deleteDoc(docSnapshot.ref),
  );
  await Promise.all(deletePromises);
};

export const recalculateCupPointsForEvent = async (event_id) => {
  // 1. Find all rounds for this event
  const roundsQuery = query(
    collection(db, ROUNDS_KEY),
    where("event_id", "==", event_id),
  );
  const roundSnapshot = await getDocs(roundsQuery);
  const eventRounds = roundSnapshot.docs.map((doc) => doc.data());

  if (eventRounds.length === 0) return;

  const roundIds = eventRounds.map((r) => r.round_id);
  const isSignatureEvent = eventRounds.some((r) => r.is_signature);
  const numRounds = eventRounds.length;

  // 2. Fetch all scores for these rounds
  const allScores = [];
  for (let i = 0; i < roundIds.length; i += 10) {
    const batch = roundIds.slice(i, i + 10);
    const scoresQuery = query(
      collection(db, SCORES_KEY),
      where("round_id", "in", batch),
    );
    const qs = await getDocs(scoresQuery);
    allScores.push(...qs.docs.map((d) => d.data()));
  }

  if (allScores.length === 0) return;

  // 3. Aggregate scores per player and track completed rounds and DNF status
  const playerStats = {};
  for (const s of allScores) {
    const pId = s.player_id;
    if (!playerStats[pId]) {
      playerStats[pId] = { total: 0, roundsPlayed: 0, hasDNF: false };
    }
    if (s.status === "DNF") {
      playerStats[pId].hasDNF = true;
    } else {
      const scoreVal = parseInt(s.score, 10);
      if (!isNaN(scoreVal)) {
        playerStats[pId].total += scoreVal;
        playerStats[pId].roundsPlayed += 1;
      }
    }
  }

  // 4. Filter players (must complete all rounds and have no DNFs)
  const playerTotals = {};
  for (const pId in playerStats) {
    if (
      !playerStats[pId].hasDNF &&
      playerStats[pId].roundsPlayed === numRounds
    ) {
      playerTotals[pId] = playerStats[pId].total;
    }
  }

  const playersArr = Object.keys(playerTotals).map((pId) => ({
    player_id: pId,
    total: playerTotals[pId],
  }));

  // Sort lowest score first
  playersArr.sort((a, b) => a.total - b.total);

  // Distribute Points
  const baseScale = [
    100, 75, 60, 50, 40, 35, 30, 25, 20, 15, 10, 10, 10, 10, 10,
  ];
  const signatureScale = [
    150, 115, 90, 75, 60, 50, 45, 35, 30, 20, 15, 15, 15, 15, 15,
  ];
  const scale = isSignatureEvent ? signatureScale : baseScale;
  const participationPoints = isSignatureEvent ? 10 : 5;

  let rank = 1;
  const rankedPlayers = [];

  // Handle ties
  for (let i = 0; i < playersArr.length; ) {
    const currentScore = playersArr[i].total;
    let tieCount = 0;

    // Count how many players have this exact score
    while (
      i + tieCount < playersArr.length &&
      playersArr[i + tieCount].total === currentScore
    ) {
      tieCount++;
    }

    // Calculate total points for these positions
    let totalPointsForTie = 0;
    for (let j = 0; j < tieCount; j++) {
      const positionIndex = rank - 1 + j;
      if (positionIndex < scale.length) {
        totalPointsForTie += scale[positionIndex];
      } else {
        totalPointsForTie += participationPoints;
      }
    }

    const pointsPerPlayer = totalPointsForTie / tieCount;

    // Assign points
    for (let j = 0; j < tieCount; j++) {
      rankedPlayers.push({
        player_id: playersArr[i + j].player_id,
        points: pointsPerPlayer,
        rank: rank,
      });
    }

    rank += tieCount;
    i += tieCount;
  }

  // Clear existing points for this event
  await deleteCupPointsForEvent(event_id);

  // Save new points
  const currentYear = new Date().getFullYear();
  const promises = rankedPlayers.map((rp) =>
    addCupPoints({
      event_id,
      player_id: rp.player_id,
      points: rp.points,
      rank: rp.rank,
      year: currentYear,
    }),
  );
  await Promise.all(promises);
};

export const updateEventName = async (event_id, newName) => {
  const roundsQuery = query(
    collection(db, ROUNDS_KEY),
    where("event_id", "==", event_id),
  );
  const querySnapshot = await getDocs(roundsQuery);
  const updatePromises = querySnapshot.docs.map((docSnapshot) => {
    const roundData = docSnapshot.data();
    let updatedName = newName;
    if (
      roundData.number_of_rounds > 1 &&
      roundData.name &&
      roundData.name.includes(" - Round ")
    ) {
      const roundNum = roundData.name.split(" - Round ")[1];
      updatedName = `${newName} - Round ${roundNum}`;
    } else if (roundData.name && roundData.name.includes(" - Round ")) {
      // Fallback
      const roundNum = roundData.name.split(" - Round ")[1];
      updatedName = `${newName} - Round ${roundNum}`;
    }
    return updateDoc(doc(db, ROUNDS_KEY, docSnapshot.id), {
      name: updatedName,
    });
  });
  await Promise.all(updatePromises);
};

export const deleteEvent = async (event_id) => {
  const roundsQuery = query(
    collection(db, ROUNDS_KEY),
    where("event_id", "==", event_id),
  );
  const querySnapshot = await getDocs(roundsQuery);
  const deletePromises = querySnapshot.docs.map((docSnapshot) =>
    deleteRound(docSnapshot.id),
  );
  await Promise.all(deletePromises);
};
