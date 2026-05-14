import { CHROME_GROUP_COLORS } from "./constants";
import { getStableColor, isChromeGroupColor } from "./colors";
import type { ClassificationResult, Settings, TabGroupSuggestion, TabInfo } from "./types";

export function validateClassificationResult(result: ClassificationResult, tabs: TabInfo[], settings: Settings): ClassificationResult {
  const existing = new Set(tabs.map((tab) => tab.id));
  const used = new Set<number>();
  const ungrouped = new Set<number>();
  const groups: TabGroupSuggestion[] = [];

  for (const group of result.groups) {
    const tabIds: number[] = [];
    for (const tabId of group.tabIds) {
      if (!existing.has(tabId) || used.has(tabId)) continue;
      used.add(tabId);
      tabIds.push(tabId);
    }
    if (tabIds.length === 0) continue;
    if (group.source !== "user-rule" && tabIds.length < settings.minTabsPerGroup) {
      for (const tabId of tabIds) ungrouped.add(tabId);
      continue;
    }
    const name = group.name.trim() || "相关标签";
    groups.push({
      ...group,
      id: group.id || `${group.source}-${name}-${tabIds.join("-")}`,
      name,
      color: isChromeGroupColor(group.color) ? group.color : getStableColor(name),
      confidence: Math.max(0, Math.min(1, group.confidence)),
      tabIds
    });
  }

  for (const tabId of result.ungroupedTabIds) {
    if (existing.has(tabId) && !used.has(tabId)) ungrouped.add(tabId);
  }
  for (const tab of tabs) {
    if (!used.has(tab.id) && !groups.some((group) => group.tabIds.includes(tab.id))) ungrouped.add(tab.id);
  }

  const sortedGroups = groups.sort((a, b) => b.tabIds.length - a.tabIds.length || b.confidence - a.confidence);
  const keptGroups = sortedGroups.slice(0, Math.max(0, settings.maxGroups));
  for (const group of sortedGroups.slice(settings.maxGroups)) {
    for (const tabId of group.tabIds) ungrouped.add(tabId);
  }
  const keptIds = new Set(keptGroups.flatMap((group) => group.tabIds));

  return {
    source: "local",
    warnings: [...result.warnings],
    groups: keptGroups.map((group) => ({
      ...group,
      color: CHROME_GROUP_COLORS.includes(group.color) ? group.color : getStableColor(group.name)
    })),
    ungroupedTabIds: [...ungrouped].filter((tabId) => existing.has(tabId) && !keptIds.has(tabId))
  };
}
