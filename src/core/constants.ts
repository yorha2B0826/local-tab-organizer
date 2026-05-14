import type { ChromeTabGroupColor, Settings } from "./types";

export const CHROME_GROUP_COLORS: ChromeTabGroupColor[] = [
  "grey",
  "blue",
  "red",
  "yellow",
  "green",
  "pink",
  "purple",
  "cyan",
  "orange"
];

export const DEFAULT_SETTINGS: Settings = {
  maxGroups: 8,
  minTabsPerGroup: 2,
  autoCollapseAfterApply: false,
  includePinnedTabs: false,
  rules: []
};

export const SETTINGS_STORAGE_KEY = "localTabOrganizerSettings";
