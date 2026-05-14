import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from "./constants";
import { isChromeGroupColor } from "./colors";
import type { Settings, UserRule } from "./types";

function chromeStorageGet<T>(key: string): Promise<T | undefined> {
  return new Promise((resolve) => chrome.storage.sync.get(key, (items) => resolve(items[key] as T | undefined)));
}

function chromeStorageSet(value: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => chrome.storage.sync.set(value, () => {
    const error = chrome.runtime.lastError;
    if (error) reject(new Error(error.message));
    else resolve();
  }));
}

function isRuleType(type: unknown): type is UserRule["type"] {
  return ["domain", "domainSuffix", "keyword", "urlRegex", "titleRegex"].includes(String(type));
}

export function sanitizeSettings(input: unknown): Settings {
  const raw = typeof input === "object" && input !== null ? input as Partial<Settings> : {};
  const rules = Array.isArray(raw.rules) ? raw.rules.filter((rule): rule is UserRule => {
    const candidate = rule as Partial<UserRule>;
    return typeof candidate.id === "string"
      && isRuleType(candidate.type)
      && typeof candidate.pattern === "string"
      && typeof candidate.groupName === "string"
      && typeof candidate.enabled === "boolean"
      && (candidate.color === undefined || isChromeGroupColor(candidate.color));
  }) : [];
  return {
    maxGroups: Number.isFinite(raw.maxGroups) ? Math.max(1, Math.min(30, Number(raw.maxGroups))) : DEFAULT_SETTINGS.maxGroups,
    minTabsPerGroup: Number.isFinite(raw.minTabsPerGroup) ? Math.max(1, Math.min(20, Number(raw.minTabsPerGroup))) : DEFAULT_SETTINGS.minTabsPerGroup,
    autoCollapseAfterApply: typeof raw.autoCollapseAfterApply === "boolean" ? raw.autoCollapseAfterApply : DEFAULT_SETTINGS.autoCollapseAfterApply,
    includePinnedTabs: typeof raw.includePinnedTabs === "boolean" ? raw.includePinnedTabs : DEFAULT_SETTINGS.includePinnedTabs,
    rules
  };
}

export async function getSettings(): Promise<Settings> {
  return sanitizeSettings(await chromeStorageGet<Settings>(SETTINGS_STORAGE_KEY));
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chromeStorageSet({ [SETTINGS_STORAGE_KEY]: sanitizeSettings(settings) });
}

export async function resetSettings(): Promise<void> {
  await chromeStorageSet({ [SETTINGS_STORAGE_KEY]: DEFAULT_SETTINGS });
}

export async function exportSettings(): Promise<string> {
  return JSON.stringify(await getSettings(), null, 2);
}

export async function importSettings(json: string): Promise<Settings> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("导入失败：JSON 格式无效");
  }
  const settings = sanitizeSettings(parsed);
  await saveSettings(settings);
  return settings;
}
