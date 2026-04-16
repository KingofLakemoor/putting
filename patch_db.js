const fs = require('fs');

const dbPath = 'src/db.jsx';
let content = fs.readFileSync(dbPath, 'utf8');

const regex = /export const recalculateCupPointsForEvent = async \([\s\S]*?export const updateEventName = async/m;

const replacement = `export const recalculateCupPointsForEvent = async (event_id) => {
  // 1. Find all rounds for this event
  const roundsQuery = query(
    collection(db, ROUNDS_KEY),
    where("event_id", "==", event_id)
  );
  const roundSnapshot = await getDocs(roundsQuery);
  const eventRounds = roundSnapshot.docs.map(doc => doc.data());

  if (eventRounds.length === 0) return;

  const roundIds = eventRounds.map(r => r.round_id);
  const isSignatureEvent = eventRounds.some(r => r.is_signature);
  const numRounds = eventRounds.length;

  // 2. Fetch all scores for these rounds
  const allScores = [];
  for (let i = 0; i < roundIds.length; i += 10) {
    const batch = roundIds.slice(i, i + 10);
    const scoresQuery = query(
      collection(db, SCORES_KEY),
      where("round_id", "in", batch)
    );
    const qs = await getDocs(scoresQuery);
    allScores.push(...qs.docs.map(d => d.data()));
  }

  if (allScores.length === 0) return;

  // 3. Aggregate scores per player and track completed rounds and DNF status
  const playerStats = {};
  for (const s of allScores) {
    const pId = s.player_id;
    if (!playerStats[pId]) {
      playerStats[pId] = { total: 0, roundsPlayed: 0, hasDNF: false };
    }
    if (s.status === 'DNF') {
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
    if (!playerStats[pId].hasDNF && playerStats[pId].roundsPlayed === numRounds) {
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
  const baseScale = [100, 75, 60, 50, 40, 35, 30, 25, 20, 15, 10, 10, 10, 10, 10];
  const signatureScale = [150, 115, 90, 75, 60, 50, 45, 35, 30, 20, 15, 15, 15, 15, 15];
  const scale = isSignatureEvent ? signatureScale : baseScale;
  const participationPoints = isSignatureEvent ? 10 : 5;

  let rank = 1;
  const rankedPlayers = [];

  // Handle ties
  for (let i = 0; i < playersArr.length; ) {
    const currentScore = playersArr[i].total;
    let tieCount = 0;

    // Count how many players have this exact score
    while (i + tieCount < playersArr.length && playersArr[i + tieCount].total === currentScore) {
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
    })
  );
  await Promise.all(promises);
};

export const updateEventName = async`;

content = content.replace(regex, replacement);

content = content.replace(
  /export const deleteCupPointsForEvent = async \(event_round_id\) => \{\s*const q = query\(\s*collection\(db, CUP_POINTS_KEY\),\s*where\("event_round_id", "==", event_round_id\),\s*\);\s*const querySnapshot = await getDocs\(q\);\s*const deletePromises = querySnapshot\.docs\.map\(\(docSnapshot\) =>\s*deleteDoc\(doc\(db, CUP_POINTS_KEY, docSnapshot\.id\)\),\s*\);\s*await Promise\.all\(deletePromises\);\s*\};/,
  `export const deleteCupPointsForEvent = async (event_id) => {
  const q = query(
    collection(db, CUP_POINTS_KEY),
    where("event_id", "==", event_id),
  );
  const querySnapshot = await getDocs(q);
  const deletePromises = querySnapshot.docs.map((docSnapshot) =>
    deleteDoc(docSnapshot.ref),
  );
  await Promise.all(deletePromises);
};`
);

fs.writeFileSync(dbPath, content);
