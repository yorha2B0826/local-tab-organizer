import { describe, expect, test } from "vitest";
import { validateClassificationResult } from "../core/validation";
import type { ClassificationResult, Settings, TabInfo } from "../core/types";

const tabs: TabInfo[] = [
  { id: 1, windowId: 1, title: "A", url: "https://a.com", domain: "a.com", pinned: false },
  { id: 2, windowId: 1, title: "B", url: "https://b.com", domain: "b.com", pinned: false }
];
const settings: Settings = { maxGroups: 8, minTabsPerGroup: 1, autoCollapseAfterApply: false, includePinnedTabs: false, enableGeminiNanoEnhancement: false, rules: [] };

function result(): ClassificationResult {
  return {
    source: "local",
    warnings: [],
    groups: [
      { id: "g1", name: "", color: "blue", tabIds: [1, 3], confidence: 2, reason: "", source: "keyword-taxonomy" },
      { id: "g2", name: "Dup", color: "not-a-color" as "blue", tabIds: [1, 2], confidence: -1, reason: "", source: "keyword-taxonomy" },
      { id: "empty", name: "Empty", color: "red", tabIds: [], confidence: 1, reason: "", source: "keyword-taxonomy" }
    ],
    ungroupedTabIds: [2, 2, 3]
  };
}

describe("validation", () => {
  test("filters missing ids and removes duplicates", () => {
    const validated = validateClassificationResult(result(), tabs, settings);
    expect(validated.groups[0].tabIds).toEqual([1]);
    expect(validated.groups[1].tabIds).toEqual([2]);
  });

  test("removes empty groups", () => {
    expect(validateClassificationResult(result(), tabs, settings).groups.find((group) => group.id === "empty")).toBeUndefined();
  });

  test("clamps confidence and repairs name and color", () => {
    const validated = validateClassificationResult(result(), tabs, settings);
    expect(validated.groups[0].name).toBe("相关标签");
    expect(validated.groups[0].confidence).toBe(1);
    expect(validated.groups[1].confidence).toBe(0);
    expect(validated.groups[1].color).not.toBe("not-a-color");
  });

  test("deduplicates ungrouped ids", () => {
    expect(validateClassificationResult(result(), tabs, settings).ungroupedTabIds).toEqual([]);
  });
});
