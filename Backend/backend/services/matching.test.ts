import { describe, expect, it } from "vitest";
import { calculateMatchScore, isLikelyMatch } from "./matching";

const lost = {
  title: "Black leather wallet",
  description: "A black leather wallet with a silver zipper and university cards inside",
  category: "Accessories" as const,
  location: "Academic Building 4 lobby",
  eventDate: Date.UTC(2026, 7, 15),
};

describe("item matching", () => {
  it("identifies a complementary report with shared category, words, location, and date", () => {
    const found = {
      title: "Found black wallet",
      description: "Leather wallet with silver zipper found near the lobby",
      category: "Accessories" as const,
      location: "AB4 lobby",
      eventDate: Date.UTC(2026, 7, 15),
    };
    expect(calculateMatchScore(lost, found)).toBeGreaterThanOrEqual(55);
    expect(isLikelyMatch(lost, found)).toBe(true);
  });

  it("rejects candidates in a different category", () => {
    const found = { ...lost, category: "Electronics" as const };
    expect(calculateMatchScore(lost, found)).toBe(0);
    expect(isLikelyMatch(lost, found)).toBe(false);
  });
});
