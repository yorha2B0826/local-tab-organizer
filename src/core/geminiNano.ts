import { validateClassificationResult } from "./validation";
import type { ClassificationResult, Settings, TabGroupSuggestion, TabInfo } from "./types";

type GeminiAvailability = "available" | "downloadable" | "downloading" | "unavailable" | string;

interface GeminiNanoSession {
  prompt(input: string, options?: unknown): Promise<string>;
  destroy(): void;
}

export interface GeminiNanoLanguageModel {
  availability(options?: unknown): Promise<GeminiAvailability>;
  create(options?: unknown): Promise<GeminiNanoSession>;
}

interface GeminiNanoGroup {
  categoryId: string;
  tabIds: number[];
  reason?: string;
}

interface GeminiNanoResponse {
  groups: GeminiNanoGroup[];
}

const CATEGORY_HINTS = [
  "github.com -> Development",
  "gitlab.com -> Development",
  "stackoverflow.com -> Development",
  "developer.chrome.com -> Technical Docs",
  "developer.mozilla.org -> Technical Docs",
  "react.dev -> Technical Docs",
  "vitejs.dev -> Technical Docs",
  "arxiv.org -> Papers",
  "scholar.google.com -> Papers",
  "weibo.com -> Social",
  "twitter.com -> Social",
  "x.com -> Social",
  "reddit.com -> Social",
  "zhihu.com -> Social",
  "youtube.com -> Video",
  "bilibili.com -> Video or Learning",
  "mail.google.com -> Mail",
  "docs.google.com -> Work Docs",
  "figma.com -> Design",
  "amazon.com -> Shopping"
];

const GEMINI_CATEGORIES = [
  { id: "development", name: "开发编程", color: "blue", label: "Development" },
  { id: "tech-docs", name: "技术文档", color: "cyan", label: "Technical Docs" },
  { id: "papers", name: "论文资料", color: "green", label: "Papers" },
  { id: "learning", name: "学习课程", color: "yellow", label: "Learning" },
  { id: "thesis", name: "毕业论文", color: "red", label: "Thesis" },
  { id: "work", name: "工作办公", color: "grey", label: "Work" },
  { id: "mail", name: "邮件通讯", color: "blue", label: "Mail" },
  { id: "cloud-files", name: "云盘文档", color: "cyan", label: "Cloud Files" },
  { id: "social", name: "社交社区", color: "pink", label: "Social" },
  { id: "news", name: "新闻资讯", color: "orange", label: "News" },
  { id: "video", name: "视频娱乐", color: "red", label: "Video" },
  { id: "music", name: "音乐音频", color: "purple", label: "Music" },
  { id: "shopping", name: "购物消费", color: "yellow", label: "Shopping" },
  { id: "finance", name: "金融支付", color: "green", label: "Finance" },
  { id: "travel", name: "旅行出行", color: "orange", label: "Travel" },
  { id: "life", name: "生活服务", color: "green", label: "Life Services" },
  { id: "design", name: "设计素材", color: "pink", label: "Design" },
  { id: "images", name: "图片资源", color: "cyan", label: "Images" },
  { id: "games", name: "游戏娱乐", color: "purple", label: "Games" }
] as const;

type GeminiCategory = (typeof GEMINI_CATEGORIES)[number];
const categoryById = new Map<string, GeminiCategory>(GEMINI_CATEGORIES.map((category) => [category.id, category]));

function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

export function buildGeminiNanoPrompt(tabs: TabInfo[], settings: Settings): string {
  const safeTabs = tabs.map((tab) => ({
    id: tab.id,
    title: tab.title.slice(0, 160),
    domain: tab.domain,
    url: tab.url.slice(0, 240)
  }));

  return `You are helping organize browser tabs into Chrome tab groups.
Use only the provided tab title, domain, and URL. Do not infer from page body content.
Return JSON only. Do not include markdown.
Schema:
{
  "groups": [
    { "categoryId": "development", "tabIds": [1, 2], "reason": "short English reason" }
  ]
}
Allowed category ids:
${GEMINI_CATEGORIES.map((category) => `${category.id}: ${category.label}`).join("\n")}

Known category hints:
${CATEGORY_HINTS.join("\n")}

Rules:
- Use at most ${settings.maxGroups} groups.
- A group must contain at least ${settings.minTabsPerGroup} tabs.
- Every tab id must come from the input.
- Do not invent tab ids.
- Do not invent category ids.
- Prefer these known categories when domains clearly match them.
- Return categoryId only. The extension maps categoryId to localized Chinese names.

Tabs:
${JSON.stringify(safeTabs, null, 2)}`;
}

export function parseGeminiNanoResponse(text: string): GeminiNanoResponse {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFence(text));
  } catch {
    throw new Error("Gemini Nano 返回内容不是有效 JSON。");
  }

  if (typeof parsed !== "object" || parsed === null || !Array.isArray((parsed as { groups?: unknown }).groups)) {
    throw new Error("Gemini Nano 返回格式无效。");
  }

  const groups = (parsed as { groups: unknown[] }).groups.map((group): GeminiNanoGroup => {
    const candidate = group as Partial<GeminiNanoGroup>;
    if (
      typeof candidate.categoryId !== "string"
      || !categoryById.has(candidate.categoryId)
      || !Array.isArray(candidate.tabIds)
      || !candidate.tabIds.every((id) => Number.isInteger(id))
      || (candidate.reason !== undefined && typeof candidate.reason !== "string")
    ) {
      throw new Error("Gemini Nano 返回格式无效。");
    }
    return {
      categoryId: candidate.categoryId,
      tabIds: candidate.tabIds,
      reason: candidate.reason?.trim()
    };
  });

  return { groups };
}

function resultFromGeminiResponse(response: GeminiNanoResponse, baseResult: ClassificationResult, tabs: TabInfo[], settings: Settings): ClassificationResult {
  const allTabIds = new Set(tabs.map((tab) => tab.id));
  const locallyGroupedIds = new Set(baseResult.groups.flatMap((group) => group.tabIds));
  const groups: TabGroupSuggestion[] = response.groups.map((group) => {
    const tabIds = [...new Set(group.tabIds)].filter((id) => allTabIds.has(id) && !locallyGroupedIds.has(id));
    const category = categoryById.get(group.categoryId);
    const name = category?.name ?? "相关标签";
    return {
      id: `gemini-nano-local-${group.categoryId}-${tabIds.sort((a, b) => a - b).join("-")}`,
      name,
      color: category?.color ?? "grey",
      tabIds,
      confidence: 0.78,
      reason: group.reason ? `Chrome 内置 Gemini Nano：${category?.label ?? group.categoryId} - ${group.reason}` : "Chrome 内置 Gemini Nano 本地增强建议",
      source: "gemini-nano-local"
    };
  });

  const geminiResult = validateClassificationResult({
    source: "local",
    warnings: [...baseResult.warnings, "已使用 Chrome 内置 Gemini Nano 本地增强生成建议。"],
    groups: [...baseResult.groups, ...groups],
    ungroupedTabIds: baseResult.ungroupedTabIds
  }, tabs, settings);

  return geminiResult.groups.length > 0 ? geminiResult : {
    ...baseResult,
    warnings: [...baseResult.warnings, "Gemini Nano 未返回可用分组，已使用本地规则结果。"]
  };
}

export async function enhanceClassificationWithGeminiNano(
  tabs: TabInfo[],
  baseResult: ClassificationResult,
  settings: Settings,
  languageModel: GeminiNanoLanguageModel | undefined = (globalThis as { LanguageModel?: GeminiNanoLanguageModel }).LanguageModel
): Promise<ClassificationResult> {
  if (!settings.enableGeminiNanoEnhancement) return baseResult;
  if (!languageModel) {
    return { ...baseResult, warnings: [...baseResult.warnings, "Chrome 内置 Gemini Nano 当前不可用，已使用本地规则结果。"] };
  }

  try {
    const languageOptions = {
      expectedInputs: [{ type: "text", languages: ["en"] }],
      expectedOutputs: [{ type: "text", languages: ["en"] }]
    };
    const availability = await languageModel.availability(languageOptions);
    if (availability === "unavailable") {
      return { ...baseResult, warnings: [...baseResult.warnings, "Chrome 内置 Gemini Nano 当前不可用，已使用本地规则结果。"] };
    }

    const remainingTabs = tabs.filter((tab) => baseResult.ungroupedTabIds.includes(tab.id));
    if (remainingTabs.length < settings.minTabsPerGroup) {
      return {
        ...baseResult,
        warnings: [...baseResult.warnings, "本地规则已完成主要分类，剩余标签不足以调用 Gemini Nano 增强。"]
      };
    }

    const session = await languageModel.create({
      ...languageOptions,
      monitor(m: EventTarget) {
        m.addEventListener("downloadprogress", () => undefined);
      }
    });
    try {
      const responseText = await session.prompt(buildGeminiNanoPrompt(remainingTabs, settings), languageOptions);
      return resultFromGeminiResponse(parseGeminiNanoResponse(responseText), baseResult, tabs, settings);
    } finally {
      session.destroy();
    }
  } catch (error) {
    return {
      ...baseResult,
      warnings: [
        ...baseResult.warnings,
        `Gemini Nano 本地增强失败，已使用本地规则结果：${error instanceof Error ? error.message : "未知错误"}`
      ]
    };
  }
}
