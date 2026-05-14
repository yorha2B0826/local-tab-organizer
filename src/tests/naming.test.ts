import { describe, expect, test } from "vitest";
import { generateClusterGroupName, generateDomainGroupName, generateGroupNameFromCategory } from "../core/naming";
import { TAXONOMY } from "../core/taxonomy";
import type { TabInfo } from "../core/types";

describe("naming", () => {
  test("returns category name", () => {
    expect(generateGroupNameFromCategory(TAXONOMY[0])).toBe("开发编程");
  });

  test("returns known site name", () => {
    expect(generateDomainGroupName("github.com")).toBe("GitHub");
  });

  test("uses frequent token for cluster name", () => {
    const tabs: TabInfo[] = [
      { id: 1, windowId: 1, title: "React hooks guide", url: "https://a.com/react", domain: "a.com", pinned: false },
      { id: 2, windowId: 1, title: "React API reference", url: "https://b.com/react", domain: "b.com", pinned: false }
    ];
    expect(generateClusterGroupName(tabs)).toContain("React");
  });

  test("does not use stop words", () => {
    const tabs: TabInfo[] = [{ id: 1, windowId: 1, title: "the and of", url: "https://a.com", domain: "", pinned: false }];
    expect(generateClusterGroupName(tabs)).toBe("相关标签");
  });

  test("falls back for empty name", () => {
    expect(generateClusterGroupName([])).toBe("相关标签");
  });
});
