import type { ChromeTabGroupColor, Settings, TabGroupSuggestion } from "./types";

function lastRuntimeError(): string | undefined {
  return chrome.runtime.lastError?.message;
}

async function existingTabIds(tabIds: number[]): Promise<{ existing: number[]; missing: number[] }> {
  const existing: number[] = [];
  const missing: number[] = [];
  for (const id of tabIds) {
    try {
      await chrome.tabs.get(id);
      if (lastRuntimeError()) missing.push(id);
      else existing.push(id);
    } catch {
      missing.push(id);
    }
  }
  return { existing, missing };
}

export async function applyGroupSuggestions(groups: TabGroupSuggestion[], settings: Settings): Promise<{ warnings: string[] }> {
  const warnings: string[] = [];
  for (const group of groups) {
    if (group.tabIds.length === 0) continue;
    try {
      const { existing, missing } = await existingTabIds(group.tabIds);
      if (missing.length > 0) warnings.push(`${group.name} 中有 ${missing.length} 个标签已不存在，已跳过。`);
      if (existing.length === 0) continue;
      const groupId = await chrome.tabs.group({ tabIds: existing });
      await chrome.tabGroups.update(groupId, {
        title: group.name,
        color: group.color,
        collapsed: settings.autoCollapseAfterApply
      });
    } catch (error) {
      warnings.push(`应用分组「${group.name}」失败：${error instanceof Error ? error.message : "未知错误"}`);
    }
  }
  return { warnings };
}

async function groupsInCurrentWindow(): Promise<chrome.tabGroups.TabGroup[]> {
  const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
  return chrome.tabGroups.query({ windowId: active?.windowId });
}

export async function collapseAllGroupsInCurrentWindow(): Promise<void> {
  for (const group of await groupsInCurrentWindow()) await chrome.tabGroups.update(group.id, { collapsed: true });
}

export async function expandAllGroupsInCurrentWindow(): Promise<void> {
  for (const group of await groupsInCurrentWindow()) await chrome.tabGroups.update(group.id, { collapsed: false });
}

export async function ungroupAllTabsInCurrentWindow(): Promise<void> {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const ids = tabs.map((tab) => tab.id).filter((id): id is number => typeof id === "number");
  if (ids.length > 0) await chrome.tabs.ungroup(ids);
}

export async function renameGroup(groupId: number, title: string): Promise<void> {
  await chrome.tabGroups.update(groupId, { title });
}

export async function updateGroupColor(groupId: number, color: ChromeTabGroupColor): Promise<void> {
  await chrome.tabGroups.update(groupId, { color });
}
