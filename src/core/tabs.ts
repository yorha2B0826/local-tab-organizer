import { extractDomain } from "./domain";
import type { Settings, TabInfo } from "./types";

const UNSUPPORTED_SCHEMES = ["chrome:", "chrome-extension:", "edge:", "about:", "devtools:", "view-source:"];

function isSupportedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return !UNSUPPORTED_SCHEMES.includes(parsed.protocol);
  } catch {
    return false;
  }
}

export async function getCurrentWindowTabs(settings: Settings): Promise<TabInfo[]> {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  return tabs
    .filter((tab) => typeof tab.id === "number")
    .filter((tab) => settings.includePinnedTabs || !tab.pinned)
    .filter((tab) => isSupportedUrl(tab.url ?? ""))
    .map((tab) => ({
      id: tab.id as number,
      windowId: tab.windowId,
      title: tab.title ?? "",
      url: tab.url ?? "",
      domain: extractDomain(tab.url ?? ""),
      favIconUrl: tab.favIconUrl,
      groupId: tab.groupId,
      pinned: Boolean(tab.pinned),
      audible: tab.audible,
      active: tab.active
    }));
}
