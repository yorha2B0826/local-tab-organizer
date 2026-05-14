import { describe, expect, test, vi } from "vitest";
import { buildGeminiNanoPrompt, enhanceClassificationWithGeminiNano, parseGeminiNanoResponse } from "../core/geminiNano";
import type { ClassificationResult, Settings, TabInfo } from "../core/types";

const tabs: TabInfo[] = [
  { id: 1, windowId: 1, title: "React API Reference", url: "https://react.dev/reference", domain: "react.dev", pinned: false },
  { id: 2, windowId: 1, title: "Vite Guide", url: "https://vitejs.dev/guide", domain: "vitejs.dev", pinned: false },
  { id: 3, windowId: 1, title: "Unrelated", url: "https://example.com", domain: "example.com", pinned: false }
];

const settings: Settings = {
  maxGroups: 8,
  minTabsPerGroup: 2,
  autoCollapseAfterApply: false,
  includePinnedTabs: false,
  enableGeminiNanoEnhancement: true,
  rules: []
};

const baseResult: ClassificationResult = {
  source: "local",
  warnings: [],
  groups: [],
  ungroupedTabIds: tabs.map((tab) => tab.id)
};

describe("geminiNano", () => {
  test("builds a privacy-preserving prompt from tab metadata only", () => {
    const prompt = buildGeminiNanoPrompt(tabs, settings);
    expect(prompt).toContain("Return JSON only");
    expect(prompt).toContain("\"categoryId\"");
    expect(prompt).toContain("Allowed category ids");
    expect(prompt).toContain("development");
    expect(prompt).toContain("social");
    expect(prompt).toContain("github.com -> Development");
    expect(prompt).toContain("weibo.com -> Social");
    expect(prompt).toContain("React API Reference");
    expect(prompt).toContain("react.dev");
    expect(prompt).not.toContain("document.body");
  });

  test("parses fenced JSON responses", () => {
    const parsed = parseGeminiNanoResponse("```json\n{\"groups\":[{\"categoryId\":\"tech-docs\",\"tabIds\":[1,2],\"reason\":\"docs\"}]}\n```");
    expect(parsed.groups[0].categoryId).toBe("tech-docs");
    expect(parsed.groups[0].tabIds).toEqual([1, 2]);
  });

  test("rejects invalid response shapes", () => {
    expect(() => parseGeminiNanoResponse("{\"groups\":[{\"categoryId\":\"unknown\",\"tabIds\":[1]}]}")).toThrow("Gemini Nano 返回格式无效");
  });

  test("uses local result when LanguageModel is unavailable", async () => {
    const result = await enhanceClassificationWithGeminiNano(tabs, baseResult, settings, undefined);
    expect(result).toEqual({
      ...baseResult,
      warnings: ["Chrome 内置 Gemini Nano 当前不可用，已使用本地规则结果。"]
    });
  });

  test("merges validated Gemini Nano suggestions", async () => {
    const destroy = vi.fn();
    const prompt = vi.fn().mockResolvedValue("{\"groups\":[{\"categoryId\":\"tech-docs\",\"tabIds\":[1,2],\"reason\":\"React and Vite docs\"}]}");
    const languageModel = {
      availability: vi.fn().mockResolvedValue("available"),
      create: vi.fn().mockResolvedValue({
        prompt,
        destroy
      })
    };

    const result = await enhanceClassificationWithGeminiNano(tabs, baseResult, settings, languageModel);
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0]).toMatchObject({ name: "技术文档", color: "cyan", tabIds: [1, 2], source: "gemini-nano-local" });
    expect(result.ungroupedTabIds).toEqual([3]);
    expect(languageModel.availability).toHaveBeenCalledWith(expect.objectContaining({
      expectedOutputs: [{ type: "text", languages: ["en"] }]
    }));
    expect(languageModel.create).toHaveBeenCalledWith(expect.objectContaining({
      expectedOutputs: [{ type: "text", languages: ["en"] }]
    }));
    expect(prompt).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      expectedOutputs: [{ type: "text", languages: ["en"] }]
    }));
    expect(destroy).toHaveBeenCalled();
  });

  test("preserves deterministic local groups and only asks Gemini Nano about ungrouped tabs", async () => {
    const localBase: ClassificationResult = {
      source: "local",
      warnings: [],
      groups: [{
        id: "domain-taxonomy-开发编程-1",
        name: "开发编程",
        color: "blue",
        tabIds: [1],
        confidence: 0.95,
        reason: "命中域名词表：github.com -> 开发编程",
        source: "domain-taxonomy"
      }],
      ungroupedTabIds: [2, 3]
    };
    const prompt = vi.fn().mockResolvedValue("{\"groups\":[{\"categoryId\":\"tech-docs\",\"tabIds\":[2,3],\"reason\":\"remaining docs\"}]}");
    const languageModel = {
      availability: vi.fn().mockResolvedValue("available"),
      create: vi.fn().mockResolvedValue({ prompt, destroy: vi.fn() })
    };

    const result = await enhanceClassificationWithGeminiNano(tabs, localBase, { ...settings, minTabsPerGroup: 1 }, languageModel);
    expect(result.groups.some((group) => group.name === "开发编程" && group.tabIds.includes(1))).toBe(true);
    expect(result.groups.some((group) => group.name === "技术文档" && group.tabIds.includes(2))).toBe(true);
    expect(prompt.mock.calls[0][0]).not.toContain("React API Reference");
  });
});
