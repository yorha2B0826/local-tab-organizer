import { normalizeText } from "./tokenizer";
import type { CategoryDefinition, ScoredCategory, TabInfo } from "./types";

function domainMatches(tabDomain: string, category: CategoryDefinition): { score: number; signals: string[] } {
  if (category.domains.includes(tabDomain)) return { score: 100, signals: [`域名 ${tabDomain}`] };
  const suffix = category.domainSuffixes.find((item) => tabDomain === item || tabDomain.endsWith(`.${item}`) || tabDomain.endsWith(item));
  return suffix ? { score: 70, signals: [`域名后缀 ${suffix}`] } : { score: 0, signals: [] };
}

function includesKeyword(haystack: string, keyword: string): boolean {
  return normalizeText(haystack).includes(normalizeText(keyword));
}

export function scoreTabAgainstCategory(tab: TabInfo, category: CategoryDefinition): ScoredCategory {
  let score = 0;
  const matchedSignals: string[] = [];
  const domainMatch = domainMatches(tab.domain, category);
  score += domainMatch.score;
  matchedSignals.push(...domainMatch.signals);

  const urlMatches = category.urlKeywords.filter((keyword) => includesKeyword(tab.url, keyword));
  const titleMatches = category.titleKeywords.filter((keyword) => includesKeyword(tab.title, keyword));
  score += urlMatches.length * 20;
  score += titleMatches.length * 25;
  matchedSignals.push(...urlMatches.map((keyword) => `URL ${keyword}`), ...titleMatches.map((keyword) => `标题 ${keyword}`));

  for (const [keyword, weight] of Object.entries(category.weightedKeywords)) {
    if (includesKeyword(`${tab.title} ${tab.url}`, keyword)) {
      score += weight;
      matchedSignals.push(`关键词 ${keyword}`);
    }
  }

  if (category.id === "thesis" && /毕业论文|毕业设计|毕设|答辩|开题报告|中期报告/.test(tab.title + tab.url)) {
    score += 60;
    matchedSignals.push("毕业论文语境");
  }

  const negativeMatches = (category.negativeKeywords ?? []).filter((keyword) => includesKeyword(`${tab.title} ${tab.url}`, keyword));
  score -= negativeMatches.length * 50;
  matchedSignals.push(...negativeMatches.map((keyword) => `排除 ${keyword}`));

  if (titleMatches.length + urlMatches.length + Object.keys(category.weightedKeywords).filter((keyword) => includesKeyword(`${tab.title} ${tab.url}`, keyword)).length > 1) {
    score += 10;
  }
  if (domainMatch.score > 0 && titleMatches.length > 0) score += 15;
  try {
    const path = new URL(tab.url).pathname;
    if ([...category.urlKeywords, ...category.titleKeywords].some((keyword) => includesKeyword(path, keyword))) score += 10;
  } catch {
    // Ignore malformed URL paths.
  }

  return { category, score, matchedSignals: [...new Set(matchedSignals)] };
}

export function isDomainTaxonomyMatch(tab: TabInfo, category: CategoryDefinition): boolean {
  return domainMatches(tab.domain, category).score >= category.minScore;
}
