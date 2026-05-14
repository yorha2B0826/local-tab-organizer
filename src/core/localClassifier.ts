import { scoreTabAgainstCategory } from "./classifier";
import { getStableColor } from "./colors";
import { generateClusterGroupName, generateDomainGroupName, generateGroupNameFromCategory } from "./naming";
import { matchUserRules } from "./rules";
import { clusterTabsBySimilarity } from "./similarity";
import { TAXONOMY } from "./taxonomy";
import { tokenize } from "./tokenizer";
import { validateClassificationResult } from "./validation";
import type { CategoryDefinition, ClassificationResult, ClassificationSource, Settings, TabGroupSuggestion, TabInfo } from "./types";

function stableId(source: ClassificationSource, name: string, tabIds: number[]): string {
  return `${source}-${name}-${[...tabIds].sort((a, b) => a - b).join("-")}`;
}

function createGroup(name: string, color: TabGroupSuggestion["color"], tabIds: number[], confidence: number, reason: string, source: ClassificationSource): TabGroupSuggestion {
  return { id: stableId(source, name, tabIds), name, color, tabIds, confidence, reason, source };
}

function addToNamedGroup(groups: TabGroupSuggestion[], group: TabGroupSuggestion): void {
  const existing = groups.find((item) => item.name === group.name && item.source === group.source);
  if (existing) {
    existing.tabIds = [...new Set([...existing.tabIds, ...group.tabIds])];
    existing.confidence = Math.max(existing.confidence, group.confidence);
    existing.reason = existing.reason === group.reason ? existing.reason : `${existing.reason}；${group.reason}`;
    existing.id = stableId(existing.source, existing.name, existing.tabIds);
  } else {
    groups.push(group);
  }
}

function keywordReason(scored: { category: CategoryDefinition; matchedSignals: string[] }): string {
  const signals = scored.matchedSignals
    .filter((signal) => signal.startsWith("标题 ") || signal.startsWith("关键词 "))
    .map((signal) => signal.replace(/^标题 |^关键词 /, ""))
    .slice(0, 4);
  return signals.length > 0
    ? `标题关键词命中：${signals.join("、")} -> ${scored.category.name}`
    : `URL关键词命中：${scored.matchedSignals.slice(0, 4).join("、")} -> ${scored.category.name}`;
}

export function classifyTabsLocally(tabs: TabInfo[], settings: Settings): ClassificationResult {
  const warnings: string[] = [];
  const groups: TabGroupSuggestion[] = [];
  const assigned = new Set<number>();
  const byId = new Map(tabs.map((tab) => [tab.id, tab]));

  for (const tab of tabs) {
    const match = matchUserRules(tab, settings.rules);
    if (match.warning) warnings.push(match.warning);
    if (match.matched && match.groupName) {
      addToNamedGroup(groups, createGroup(match.groupName, match.color ?? getStableColor(match.groupName), [tab.id], 1, match.reason ?? `命中用户规则：${match.groupName}`, "user-rule"));
      assigned.add(tab.id);
    }
  }

  for (const tab of tabs.filter((item) => !assigned.has(item.id))) {
    const category = TAXONOMY.find((item) => item.domains.includes(tab.domain) || item.domainSuffixes.some((suffix) => tab.domain === suffix || tab.domain.endsWith(`.${suffix}`)));
    if (category) {
      const name = generateGroupNameFromCategory(category);
      addToNamedGroup(groups, createGroup(name, category.color, [tab.id], 0.95, `命中域名词表：${tab.domain} -> ${name}`, "domain-taxonomy"));
      assigned.add(tab.id);
    }
  }

  for (const tab of tabs.filter((item) => !assigned.has(item.id))) {
    const scored = TAXONOMY.map((category) => scoreTabAgainstCategory(tab, category)).sort((a, b) => b.score - a.score);
    const best = scored[0];
    const second = scored[1];
    if (best && best.score >= best.category.minScore) {
      const confidence = second && best.score - second.score < 10 ? 0.68 : Math.min(0.92, best.score / 120);
      const name = generateGroupNameFromCategory(best.category);
      addToNamedGroup(groups, createGroup(name, best.category.color, [tab.id], confidence, keywordReason(best), "keyword-taxonomy"));
      assigned.add(tab.id);
    }
  }

  const domainBuckets = new Map<string, TabInfo[]>();
  for (const tab of tabs.filter((item) => !assigned.has(item.id) && item.domain)) {
    domainBuckets.set(tab.domain, [...(domainBuckets.get(tab.domain) ?? []), tab]);
  }
  for (const [domain, bucket] of domainBuckets) {
    if (bucket.length >= settings.minTabsPerGroup) {
      const name = generateDomainGroupName(domain);
      const tabIds = bucket.map((tab) => tab.id);
      addToNamedGroup(groups, createGroup(name, getStableColor(name), tabIds, 0.72, `同域名聚合：${domain}`, "domain-aggregation"));
      tabIds.forEach((id) => assigned.add(id));
    }
  }

  const remaining = tabs.filter((tab) => !assigned.has(tab.id));
  for (const clusterIds of clusterTabsBySimilarity(remaining, 0.35)) {
    if (clusterIds.length >= settings.minTabsPerGroup) {
      const clusterTabs = clusterIds.map((id) => byId.get(id)).filter((tab): tab is TabInfo => Boolean(tab));
      const shared = tokenize(clusterTabs.map((tab) => `${tab.title} ${tab.domain}`).join(" ")).slice(0, 4);
      const name = generateClusterGroupName(clusterTabs);
      addToNamedGroup(groups, createGroup(name, getStableColor(name), clusterIds, 0.62, `与 ${clusterIds.length} 个标签共享关键词：${shared.join("、") || "相似标题"}`, "similarity-cluster"));
      clusterIds.forEach((id) => assigned.add(id));
    }
  }

  const result: ClassificationResult = {
    source: "local",
    groups,
    ungroupedTabIds: tabs.filter((tab) => !assigned.has(tab.id)).map((tab) => tab.id),
    warnings
  };
  return validateClassificationResult(result, tabs, settings);
}
