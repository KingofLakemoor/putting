/**
 * Generates Swiss-system pairings for a given list of players.
 *
 * @param {Array} players - Array of player objects: { id: string, score: number, hasHadBye: boolean }
 * @param {Array} previousMatchups - Array of objects: { player1_id: string, player2_id: string }
 * @returns {Array} - Array of pairings: { player1_id: string, player2_id: string | null }
 */
export function generateSwissPairings(players, previousMatchups = []) {
  if (!players || players.length === 0) return [];

  // Create a fast lookup for previous matchups
  const played = new Set();
  for (const match of previousMatchups) {
    if (match.player1_id && match.player2_id) {
      played.add(`${match.player1_id}-${match.player2_id}`);
      played.add(`${match.player2_id}-${match.player1_id}`);
    }
  }

  // Sort players by score descending
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  // Add a dummy "BYE" player if odd number of players
  const needsBye = sortedPlayers.length % 2 !== 0;
  if (needsBye) {
    sortedPlayers.push({ id: null, score: -Infinity, hasHadBye: false });
  }

  const pairings = [];
  const used = new Set();

  // Helper for backtracking
  function backtrack(index) {
    if (index >= sortedPlayers.length) {
      return true; // All paired successfully
    }

    if (used.has(index)) {
      return backtrack(index + 1); // Skip already paired
    }

    const p1 = sortedPlayers[index];
    used.add(index);

    // Try to pair p1 with every available p2, starting from the next highest score
    for (let j = index + 1; j < sortedPlayers.length; j++) {
      if (used.has(j)) continue;

      const p2 = sortedPlayers[j];

      // Check constraints
      if (p2.id === null) {
        // p2 is the BYE. p1 can only get it if p1 hasn't had a bye
        if (p1.hasHadBye) continue;
      } else if (p1.id === null) {
        // p1 is the BYE. p2 can only get it if p2 hasn't had a bye
        if (p2.hasHadBye) continue;
      } else {
        // Normal match: check if they already played
        if (played.has(`${p1.id}-${p2.id}`)) continue;
      }

      // Valid pair, tentatively assign
      used.add(j);

      const pairing = {
        player1_id: p1.id !== null ? p1.id : p2.id,
        player2_id: p1.id !== null ? p2.id : null, // Ensure null is always player2_id
      };

      pairings.push(pairing);

      if (backtrack(index + 1)) {
        return true; // Found a complete valid pairing
      }

      // Backtrack
      pairings.pop();
      used.delete(j);
    }

    used.delete(index);
    return false;
  }

  const success = backtrack(0);

  if (!success) {
    throw new Error(
      "Could not generate valid Swiss pairings (perhaps too many rounds for the number of players).",
    );
  }

  return pairings;
}
