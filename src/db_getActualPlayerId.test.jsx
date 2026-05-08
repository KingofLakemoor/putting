import { vi } from "vitest";
import { getActualPlayerId } from "./db";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

vi.mock("./firebase", () => ({
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
}));

describe("getActualPlayerId tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return null if no uid_or_player_id is provided", async () => {
    const result = await getActualPlayerId(null);
    expect(result).toBeNull();
  });

  it("should return player_id if UID is found in the initial query (Happy Path)", async () => {
    const mockUid = "user123";
    const mockPlayerId = "player456";

    const mockQuerySnapshot = {
      empty: false,
      docs: [{ data: () => ({ player_id: mockPlayerId }) }],
    };

    getDocs.mockResolvedValue(mockQuerySnapshot);

    const result = await getActualPlayerId(mockUid);

    expect(collection).toHaveBeenCalledWith(db, "putting_league_players");
    expect(where).toHaveBeenCalledWith("uid", "==", mockUid);
    expect(getDocs).toHaveBeenCalled();
    expect(result).toBe(mockPlayerId);
  });

  it("should return player_id from fallback check if not found via UID query (Fallback Path)", async () => {
    const mockUid = "player789";
    const mockPlayerId = "player789";

    // Initial query returns empty
    getDocs.mockResolvedValue({ empty: true });

    const mockDocSnap = {
      exists: () => true,
      data: () => ({ player_id: mockPlayerId }),
    };
    getDoc.mockResolvedValue(mockDocSnap);

    const result = await getActualPlayerId(mockUid);

    expect(getDocs).toHaveBeenCalled();
    expect(doc).toHaveBeenCalledWith(db, "putting_league_players", mockUid);
    expect(getDoc).toHaveBeenCalled();
    expect(result).toBe(mockPlayerId);
  });

  it("should return original ID if fallback getDoc throws an error (Error Path)", async () => {
    const mockUid = "unknownID";

    // Initial query returns empty
    getDocs.mockResolvedValue({ empty: true });

    // Fallback getDoc throws an error
    getDoc.mockRejectedValue(new Error("Invalid ID"));

    const result = await getActualPlayerId(mockUid);

    expect(getDocs).toHaveBeenCalled();
    expect(getDoc).toHaveBeenCalled();
    expect(result).toBe(mockUid);
  });
});
