import { describe, expect, test } from "vitest";
import { matchUserRules } from "../core/rules";
import type { TabInfo, UserRule } from "../core/types";

const tab: TabInfo = { id: 1, windowId: 1, title: "React API Reference", url: "https://react.dev/reference", domain: "react.dev", pinned: false };

function rule(overrides: Partial<UserRule>): UserRule {
  return { id: crypto.randomUUID(), type: "domain", pattern: "react.dev", groupName: "Docs", enabled: true, ...overrides };
}

describe("rules", () => {
  test("matches domain rules", () => {
    expect(matchUserRules(tab, [rule({ pattern: "react.dev" })]).matched).toBe(true);
  });

  test("matches domain suffix rules", () => {
    expect(matchUserRules(tab, [rule({ type: "domainSuffix", pattern: ".dev" })]).matched).toBe(true);
  });

  test("matches keyword rules", () => {
    expect(matchUserRules(tab, [rule({ type: "keyword", pattern: "api" })]).matched).toBe(true);
  });

  test("matches url regex rules", () => {
    expect(matchUserRules(tab, [rule({ type: "urlRegex", pattern: "reference$" })]).matched).toBe(true);
  });

  test("matches title regex rules", () => {
    expect(matchUserRules(tab, [rule({ type: "titleRegex", pattern: "React.*Reference" })]).matched).toBe(true);
  });

  test("invalid regex does not crash", () => {
    const result = matchUserRules(tab, [rule({ type: "titleRegex", pattern: "[" })]);
    expect(result.matched).toBe(false);
    expect(result.warning).toContain("正则无效");
  });

  test("disabled rules do not match", () => {
    expect(matchUserRules(tab, [rule({ enabled: false })]).matched).toBe(false);
  });

  test("first enabled match wins", () => {
    expect(matchUserRules(tab, [rule({ groupName: "First" }), rule({ groupName: "Second" })]).groupName).toBe("First");
  });
});
