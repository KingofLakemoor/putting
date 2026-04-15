import { describe, it, expect } from "vitest";
import { formatDisplayName } from "./format";

describe("formatDisplayName", () => {
  it("formats standard names to First Last Initial", () => {
    expect(formatDisplayName("John Doe")).toBe("John D.");
  });

  it("handles emails correctly", () => {
    expect(formatDisplayName("john.doe@example.com")).toBe("John D.");
    expect(formatDisplayName("johndoe@example.com")).toBe("Johndoe");
  });

  it("handles empty or null names", () => {
    expect(formatDisplayName("")).toBe("Unknown Player");
    expect(formatDisplayName(null)).toBe("Unknown Player");
  });

  it("resolves collisions by expanding last name length", () => {
    const allNames = ["John Davis", "John Doe"];
    expect(formatDisplayName("John Doe", allNames)).toBe("John Do.");
    expect(formatDisplayName("John Davis", allNames)).toBe("John Da.");
  });
});
