import { describe, expect, test } from "vitest";
import { classifyTabsLocally } from "../core/localClassifier";
import type { Settings, TabInfo } from "../core/types";

const settings: Settings = { maxGroups: 8, minTabsPerGroup: 2, autoCollapseAfterApply: false, includePinnedTabs: false, enableGeminiNanoEnhancement: false, rules: [] };
function tab(id: number, title: string, url: string, domain: string): TabInfo {
  return { id, windowId: 1, title, url, domain, pinned: false };
}

describe("localClassifier", () => {
  test("groups GitHub tabs into development", () => {
    const result = classifyTabsLocally([tab(1, "repo", "https://github.com/a/b", "github.com"), tab(2, "issues", "https://github.com/a/b/issues", "github.com")], settings);
    expect(result.groups.some((group) => group.name === "开发编程")).toBe(true);
  });

  test("groups developer.chrome.com into tech docs", () => {
    const result = classifyTabsLocally([tab(1, "API Reference", "https://developer.chrome.com/docs/extensions", "developer.chrome.com"), tab(2, "Guide", "https://developer.chrome.com/docs/webstore", "developer.chrome.com")], settings);
    expect(result.groups.some((group) => group.name === "技术文档")).toBe(true);
  });

  test("groups arxiv and scholar into papers", () => {
    const result = classifyTabsLocally([tab(1, "arXiv paper", "https://arxiv.org/abs/1", "arxiv.org"), tab(2, "citation", "https://scholar.google.com/scholar", "scholar.google.com")], settings);
    expect(result.groups.some((group) => group.name === "论文资料")).toBe(true);
  });

  test("groups Chinese thesis keywords", () => {
    const result = classifyTabsLocally([tab(1, "毕业论文答辩", "https://example.com/thesis", "example.com"), tab(2, "毕业论文参考文献格式", "https://example.org/ref", "example.org")], settings);
    expect(result.groups.some((group) => group.name === "毕业论文")).toBe(true);
  });

  test("React docs API goes to docs or development", () => {
    const result = classifyTabsLocally([tab(1, "React API Reference", "https://react.dev/reference", "react.dev"), tab(2, "React docs", "https://react.dev/learn", "react.dev")], settings);
    expect(result.groups.some((group) => ["技术文档", "开发编程"].includes(group.name))).toBe(true);
  });

  test("user rules have priority", () => {
    const result = classifyTabsLocally([tab(1, "GitHub", "https://github.com/a", "github.com")], { ...settings, rules: [{ id: "r", type: "domain", pattern: "github.com", groupName: "我的仓库", color: "orange", enabled: true }] });
    expect(result.groups[0].name).toBe("我的仓库");
  });

  test("aggregates unknown same-domain tabs", () => {
    const result = classifyTabsLocally([tab(1, "One", "https://example.com/a", "example.com"), tab(2, "Two", "https://example.com/b", "example.com")], settings);
    expect(result.groups.some((group) => group.reason.includes("同域名聚合"))).toBe(true);
  });

  test("clusters similar unknown titles", () => {
    const result = classifyTabsLocally([tab(1, "Nebula Foobar Notes", "https://a.test/nebula-foobar", "a.test"), tab(2, "Nebula Foobar Checklist", "https://b.test/nebula-foobar", "b.test")], settings);
    expect(result.groups.some((group) => group.source === "similarity-cluster")).toBe(true);
  });

  test("moves ordinary small groups to ungrouped", () => {
    const result = classifyTabsLocally([tab(1, "GitHub repo", "https://github.com/a", "github.com")], settings);
    expect(result.groups).toHaveLength(0);
    expect(result.ungroupedTabIds).toEqual([1]);
  });

  test("honors maxGroups", () => {
    const many = Array.from({ length: 8 }, (_, index) => tab(index + 1, `Unknown ${index}`, `https://domain${index}.com/a`, `domain${index}.com`))
      .flatMap((first, index) => [first, tab(index + 101, `Unknown ${index} b`, `https://domain${index}.com/b`, `domain${index}.com`)]);
    const result = classifyTabsLocally(many, { ...settings, maxGroups: 3 });
    expect(result.groups).toHaveLength(3);
  });
});
