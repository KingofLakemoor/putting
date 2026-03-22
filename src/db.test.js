import { addCourse } from './db';
import { v4 as uuidv4 } from 'uuid';
import { setDoc, doc } from 'firebase/firestore';
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
});
