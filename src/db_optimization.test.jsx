import { vi } from "vitest";
import { deleteCupPointsForEvent } from "./db";
import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";

vi.mock("./firebase", () => ({
  db: { type: "db" },
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  deleteDoc: vi.fn(),
  writeBatch: vi.fn(),
  doc: vi.fn(),
  serverTimestamp: vi.fn(),
}));

describe("deleteCupPointsForEvent optimization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should use writeBatch to delete documents", async () => {
    const event_id = "test-event-123";
    const mockCollectionRef = { type: "collection" };
    const mockWhereClause = { type: "where" };
    const mockQuery = { type: "query" };

    collection.mockReturnValue(mockCollectionRef);
    where.mockReturnValue(mockWhereClause);
    query.mockReturnValue(mockQuery);

    const mockDocs = [
      { ref: { id: "doc1" } },
      { ref: { id: "doc2" } },
    ];
    getDocs.mockResolvedValue({ docs: mockDocs });

    const mockBatch = {
      delete: vi.fn(),
      commit: vi.fn().mockResolvedValue(),
    };
    writeBatch.mockReturnValue(mockBatch);

    await deleteCupPointsForEvent(event_id);

    expect(collection).toHaveBeenCalledWith(db, "putting_league_cup_points");
    expect(where).toHaveBeenCalledWith("event_id", "==", event_id);
    expect(query).toHaveBeenCalledWith(mockCollectionRef, mockWhereClause);
    expect(getDocs).toHaveBeenCalledWith(mockQuery);

    expect(writeBatch).toHaveBeenCalledWith(db);
    expect(mockBatch.delete).toHaveBeenCalledTimes(2);
    expect(mockBatch.delete).toHaveBeenCalledWith(mockDocs[0].ref);
    expect(mockBatch.delete).toHaveBeenCalledWith(mockDocs[1].ref);
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
  });

  it("should handle chunking when more than 500 documents", async () => {
    const event_id = "large-event";
    const mockDocs = Array.from({ length: 600 }, (_, i) => ({
      ref: { id: `doc${i}` }
    }));
    getDocs.mockResolvedValue({ docs: mockDocs });

    const mockBatch = {
      delete: vi.fn(),
      commit: vi.fn().mockResolvedValue(),
    };
    writeBatch.mockReturnValue(mockBatch);

    await deleteCupPointsForEvent(event_id);

    // Should create 2 batches (500 + 100)
    expect(writeBatch).toHaveBeenCalledTimes(2);
    expect(mockBatch.delete).toHaveBeenCalledTimes(600);
    expect(mockBatch.commit).toHaveBeenCalledTimes(2);
  });
});
