import type { ItemCategory } from "../../shared/lostFound";

export type MatchableItem = {
  title: string;
  description: string;
  category: ItemCategory;
  location: string;
  eventDate: number;
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "at",
  "for",
  "from",
  "in",
  "is",
  "it",
  "my",
  "of",
  "on",
  "the",
  "to",
  "was",
  "with",
]);

function tokens(value: string) {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(token => token.length > 2 && !STOP_WORDS.has(token)),
  );
}

function overlapRatio(left: Set<string>, right: Set<string>) {
  if (!left.size || !right.size) return 0;
  const overlap = Array.from(left).filter(token => right.has(token)).length;
  return overlap / Math.min(left.size, right.size);
}

export function calculateMatchScore(lost: MatchableItem, found: MatchableItem) {
  if (lost.category !== found.category) return 0;

  let score = 35;
  const lostWords = tokens(`${lost.title} ${lost.description}`);
  const foundWords = tokens(`${found.title} ${found.description}`);
  score += Math.round(overlapRatio(lostWords, foundWords) * 35);

  const lostLocation = tokens(lost.location);
  const foundLocation = tokens(found.location);
  score += Math.round(overlapRatio(lostLocation, foundLocation) * 20);

  const dayDifference = Math.abs(lost.eventDate - found.eventDate) / 86_400_000;
  if (dayDifference <= 1) score += 10;
  else if (dayDifference <= 7) score += 7;
  else if (dayDifference <= 14) score += 4;

  return Math.min(100, score);
}

export function isLikelyMatch(lost: MatchableItem, found: MatchableItem) {
  return calculateMatchScore(lost, found) >= 55;
}
