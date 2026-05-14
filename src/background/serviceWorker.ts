import { classifyTabsLocally } from "../core/localClassifier";
import { DEFAULT_SETTINGS } from "../core/constants";
import { applyGroupSuggestions, collapseAllGroupsInCurrentWindow, expandAllGroupsInCurrentWindow, ungroupAllTabsInCurrentWindow } from "../core/grouping";
import { exportSettings, getSettings, importSettings, resetSettings, saveSettings } from "../core/storage";
import { getCurrentWindowTabs } from "../core/tabs";
import type { Settings, TabGroupSuggestion } from "../core/types";

type Message =
  | { type: "GET_TABS" }
  | { type: "CLASSIFY_TABS_LOCAL" }
  | { type: "APPLY_GROUPS"; groups: TabGroupSuggestion[]; settings?: Settings }
  | { type: "COLLAPSE_ALL" }
  | { type: "EXPAND_ALL" }
  | { type: "UNGROUP_ALL" }
  | { type: "GET_SETTINGS" }
  | { type: "SAVE_SETTINGS"; settings: Settings }
  | { type: "RESET_SETTINGS" }
  | { type: "EXPORT_SETTINGS" }
  | { type: "IMPORT_SETTINGS"; json: string };

async function ensureDefaultSettings(): Promise<void> {
  const existing = await getSettings();
  await saveSettings({ ...DEFAULT_SETTINGS, ...existing, rules: existing.rules ?? [] });
}

chrome.runtime.onInstalled.addListener(() => {
  ensureDefaultSettings().catch(() => undefined);
});

chrome.action.onClicked.addListener(async (tab) => {
  if (chrome.sidePanel?.open && tab.windowId) {
    await chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => undefined);
  }
});

chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  (async () => {
    try {
      const settings = await getSettings();
      switch (message.type) {
        case "GET_TABS":
          return { ok: true, data: await getCurrentWindowTabs(settings) };
        case "CLASSIFY_TABS_LOCAL": {
          const tabs = await getCurrentWindowTabs(settings);
          return { ok: true, data: { tabs, result: classifyTabsLocally(tabs, settings) } };
        }
        case "APPLY_GROUPS":
          return { ok: true, data: await applyGroupSuggestions(message.groups, message.settings ?? settings) };
        case "COLLAPSE_ALL":
          await collapseAllGroupsInCurrentWindow();
          return { ok: true, data: null };
        case "EXPAND_ALL":
          await expandAllGroupsInCurrentWindow();
          return { ok: true, data: null };
        case "UNGROUP_ALL":
          await ungroupAllTabsInCurrentWindow();
          return { ok: true, data: null };
        case "GET_SETTINGS":
          return { ok: true, data: settings };
        case "SAVE_SETTINGS":
          await saveSettings(message.settings);
          return { ok: true, data: await getSettings() };
        case "RESET_SETTINGS":
          await resetSettings();
          return { ok: true, data: await getSettings() };
        case "EXPORT_SETTINGS":
          return { ok: true, data: await exportSettings() };
        case "IMPORT_SETTINGS":
          return { ok: true, data: await importSettings(message.json) };
        default:
          throw new Error("未知消息类型");
      }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "未知错误" };
    }
  })().then(sendResponse);
  return true;
});
