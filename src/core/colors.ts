import { CHROME_GROUP_COLORS } from "./constants";
import type { ChromeTabGroupColor } from "./types";

export function isChromeGroupColor(color: unknown): color is ChromeTabGroupColor {
  return typeof color === "string" && CHROME_GROUP_COLORS.includes(color as ChromeTabGroupColor);
}

export function getStableColor(input: string): ChromeTabGroupColor {
  let hash = 0;
  for (const char of input || "local-tab") {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }
  return CHROME_GROUP_COLORS[Math.abs(hash) % CHROME_GROUP_COLORS.length];
}
