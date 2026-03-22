import { addCourse, getScoresForRound } from './db';
import { v4 as uuidv4 } from 'uuid';
import { setDoc, doc, collection, query, where, getDocs } from 'firebase/firestore';
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
});
