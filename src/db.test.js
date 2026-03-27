import { addCourse, getScoresForRound, deletePlayer, updateRoundStatus } from './db';
import { v4 as uuidv4 } from 'uuid';
import { setDoc, doc, collection, query, where, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

jest.mock('uuid');
jest.mock('./firebase', () => ({
  db: {}
}));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  collection: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn()
}));

describe('db.js tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addCourse', () => {
    it('should generate a course_id, call setDoc with the correct arguments, and return the new course object', async () => {
      const mockCourseId = 'mock-uuid-123';
      uuidv4.mockReturnValue(mockCourseId);

      const mockDocRef = { id: mockCourseId };
      doc.mockReturnValue(mockDocRef);

      const courseInput = { name: 'Test Course', holes: 18 };

      const result = await addCourse(courseInput);

      expect(uuidv4).toHaveBeenCalled();
      expect(doc).toHaveBeenCalledWith(db, 'putting_league_courses', mockCourseId);

      const expectedNewCourse = {
        course_id: mockCourseId,
        ...courseInput
      };

      expect(setDoc).toHaveBeenCalledWith(mockDocRef, expectedNewCourse);
      expect(result).toEqual(expectedNewCourse);
    });
  });

  describe('deletePlayer', () => {
    it('should delete the player and handle the case where they have no associated scores', async () => {
      const mockPlayerId = 'mock-player-123';
      const mockPlayerDocRef = { id: mockPlayerId };

      // Mock doc to return player ref
      doc.mockReturnValue(mockPlayerDocRef);

      // Mock for score querying
      const mockScoresCollectionRef = { type: 'collection' };
      collection.mockReturnValue(mockScoresCollectionRef);

      const mockWhereClause = { type: 'where', field: 'player_id', op: '==', value: mockPlayerId };
      where.mockReturnValue(mockWhereClause);

      const mockQueryRef = { type: 'query' };
      query.mockReturnValue(mockQueryRef);

      // Return empty docs array to simulate no scores
      const mockQuerySnapshot = { docs: [] };
      getDocs.mockResolvedValue(mockQuerySnapshot);

      await deletePlayer(mockPlayerId);

      // Assertions for player deletion
      expect(doc).toHaveBeenCalledWith(db, 'putting_league_players', mockPlayerId);
      expect(deleteDoc).toHaveBeenCalledWith(mockPlayerDocRef);

      // Assertions for score queries
      expect(collection).toHaveBeenCalledWith(db, 'putting_league_scores');
      expect(where).toHaveBeenCalledWith('player_id', '==', mockPlayerId);
      expect(query).toHaveBeenCalledWith(mockScoresCollectionRef, mockWhereClause);
      expect(getDocs).toHaveBeenCalledWith(mockQueryRef);

      // Assert deleteDoc was only called once (for the player itself)
      expect(deleteDoc).toHaveBeenCalledTimes(1);
    });
  });

  describe('getScoresForRound', () => {
    it('should query the scores collection by round_id and return an array of score data', async () => {
      const mockRoundId = 'round-456';

      const mockCollectionRef = { type: 'collection' };
      collection.mockReturnValue(mockCollectionRef);

      const mockWhereClause = { type: 'where', field: 'round_id', op: '==', value: mockRoundId };
      where.mockReturnValue(mockWhereClause);

      const mockQueryRef = { type: 'query' };
      query.mockReturnValue(mockQueryRef);

      const mockScoresData = [
        { score_id: 'score1', player_id: 'player1', score: 25 },
        { score_id: 'score2', player_id: 'player2', score: 27 }
      ];

      const mockQuerySnapshot = {
        docs: [
          { data: () => mockScoresData[0] },
          { data: () => mockScoresData[1] }
        ]
      };

      getDocs.mockResolvedValue(mockQuerySnapshot);

      const result = await getScoresForRound(mockRoundId);

      expect(collection).toHaveBeenCalledWith(db, 'putting_league_scores');
      expect(where).toHaveBeenCalledWith('round_id', '==', mockRoundId);
      expect(query).toHaveBeenCalledWith(mockCollectionRef, mockWhereClause);
      expect(getDocs).toHaveBeenCalledWith(mockQueryRef);
      expect(result).toEqual(mockScoresData);
    });
  });

  describe('updateRoundStatus', () => {
    it('should call updateDoc with the correct document reference and status object', async () => {
      const mockRoundId = 'round-789';
      const mockStatus = 'completed';
      const mockDocRef = { id: mockRoundId };

      // Mock doc to return our mock ref
      doc.mockReturnValue(mockDocRef);

      await updateRoundStatus(mockRoundId, mockStatus);

      // Verify doc was called correctly to get the reference
      expect(doc).toHaveBeenCalledWith(db, 'putting_league_rounds', mockRoundId);

      // Verify updateDoc was called with the ref and the new status
      expect(updateDoc).toHaveBeenCalledWith(mockDocRef, { status: mockStatus });
    });
  });
});
