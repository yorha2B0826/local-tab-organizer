import { getSiteName } from "./domain";
import { stopWords, tokenize } from "./tokenizer";
import type { CategoryDefinition, TabInfo } from "./types";

const noisyTokens = new Set(["com", "org", "net", "dev", "test", "www", "html", "https", "http"]);

export function generateGroupNameFromCategory(category: CategoryDefinition): string {
  return category.name || "相关标签";
}

export function generateDomainGroupName(domain: string): string {
  return getSiteName(domain);
}

function trimName(token: string): string {
  if (/^[\p{Script=Han}]+$/u.test(token)) return token.slice(0, 8);
  return token.slice(0, 16).replace(/\b\w/g, (char) => char.toUpperCase());
}

export function generateClusterGroupName(tabs: TabInfo[]): string {
  const counts = new Map<string, number>();
  for (const tab of tabs) {
    for (const token of tokenize(tab.title)) {
      if (!stopWords.has(token) && !noisyTokens.has(token)) counts.set(token, (counts.get(token) ?? 0) + 1);
    }
  }
  const best = [...counts.entries()]
    .filter(([token]) => token.length >= 2)
    .sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)[0]?.[0];
  return best ? `${trimName(best)}相关` : "相关标签";
}
