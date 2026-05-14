import { describe, expect, test } from "vitest";
import { jaccardSimilarity } from "../core/similarity";

describe("similarity", () => {
  test("returns 1 for equal token sets", () => {
    expect(jaccardSimilarity(["react", "docs"], ["docs", "react"])).toBe(1);
  });

  test("returns 0 for disjoint token sets", () => {
    expect(jaccardSimilarity(["react"], ["论文"])).toBe(0);
  });

  test("returns Jaccard ratio for partial overlap", () => {
    expect(jaccardSimilarity(["a", "b", "c"], ["b", "c", "d"])).toBeCloseTo(0.5);
  });

  test("handles empty arrays", () => {
    expect(jaccardSimilarity([], [])).toBe(0);
  });
});
