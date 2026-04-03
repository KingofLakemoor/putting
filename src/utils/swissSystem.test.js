import { describe, it, expect } from 'vitest';
import { generateSwissPairings } from './swissSystem';

describe('Swiss System Pairings', () => {
  it('pairs an even number of players correctly without previous matchups', () => {
    const players = [
      { id: '1', score: 3, hasHadBye: false },
      { id: '2', score: 3, hasHadBye: false },
      { id: '3', score: 0, hasHadBye: false },
      { id: '4', score: 0, hasHadBye: false }
    ];

    const pairings = generateSwissPairings(players, []);

    expect(pairings).toHaveLength(2);
    // Expect highest scores to play each other
    expect(pairings).toContainEqual({ player1_id: '1', player2_id: '2' });
    expect(pairings).toContainEqual({ player1_id: '3', player2_id: '4' });
  });

  it('assigns a bye correctly to the lowest score for an odd number of players', () => {
    const players = [
      { id: '1', score: 3, hasHadBye: false },
      { id: '2', score: 3, hasHadBye: false },
      { id: '3', score: 0, hasHadBye: false }
    ];

    const pairings = generateSwissPairings(players, []);

    expect(pairings).toHaveLength(2);
    expect(pairings).toContainEqual({ player1_id: '1', player2_id: '2' });
    // Lowest score gets the bye
    expect(pairings).toContainEqual({ player1_id: '3', player2_id: null });
  });

  it('does not assign a bye to a player who has already had one', () => {
    const players = [
      { id: '1', score: 3, hasHadBye: false },
      { id: '2', score: 3, hasHadBye: false },
      { id: '3', score: 0, hasHadBye: true } // Already had a bye!
    ];

    const pairings = generateSwissPairings(players, []);

    expect(pairings).toHaveLength(2);

    // 3 cannot have a bye again. So 1 or 2 must get it, and 3 plays the other.
    // 1 and 2 have same score, algorithm pairs 1 with 3, and 2 gets bye (or vice versa).
    const player3Pairing = pairings.find(p => p.player1_id === '3' || p.player2_id === '3');
    expect(player3Pairing.player2_id).not.toBeNull();
  });

  it('avoids repeat matchups and finds an alternative valid pairing', () => {
    const players = [
      { id: '1', score: 3, hasHadBye: false },
      { id: '2', score: 3, hasHadBye: false },
      { id: '3', score: 3, hasHadBye: false },
      { id: '4', score: 3, hasHadBye: false }
    ];

    // 1 and 2 already played
    const previousMatchups = [
      { player1_id: '1', player2_id: '2' }
    ];

    const pairings = generateSwissPairings(players, previousMatchups);

    expect(pairings).toHaveLength(2);

    // 1 cannot play 2. 1 must play 3 or 4.
    const player1Pairing = pairings.find(p => p.player1_id === '1' || p.player2_id === '1');
    expect(player1Pairing.player1_id === '2' || player1Pairing.player2_id === '2').toBe(false);
  });

  it('throws an error if a valid pairing is impossible', () => {
    const players = [
      { id: '1', score: 3, hasHadBye: false },
      { id: '2', score: 3, hasHadBye: false },
      { id: '3', score: 3, hasHadBye: false },
      { id: '4', score: 3, hasHadBye: false }
    ];

    // In a 4 player tournament, if 1 has played everyone, it's impossible.
    const previousMatchups = [
      { player1_id: '1', player2_id: '2' },
      { player1_id: '1', player2_id: '3' },
      { player1_id: '1', player2_id: '4' }
    ];

    expect(() => generateSwissPairings(players, previousMatchups)).toThrowError(/Could not generate valid Swiss pairings/);
  });
});
