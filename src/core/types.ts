export type ChromeTabGroupColor =
  | "grey"
  | "blue"
  | "red"
  | "yellow"
  | "green"
  | "pink"
  | "purple"
  | "cyan"
  | "orange";

export interface TabInfo {
  id: number;
  windowId: number;
  title: string;
  url: string;
  domain: string;
  favIconUrl?: string;
  groupId?: number;
  pinned: boolean;
  audible?: boolean;
  active?: boolean;
}

export type ClassificationSource =
  | "user-rule"
  | "domain-taxonomy"
  | "keyword-taxonomy"
  | "domain-aggregation"
  | "similarity-cluster"
  | "local-hybrid";

export interface TabGroupSuggestion {
  id: string;
  name: string;
  color: ChromeTabGroupColor;
  tabIds: number[];
  confidence: number;
  reason: string;
  source: ClassificationSource;
}

export interface ClassificationResult {
  groups: TabGroupSuggestion[];
  ungroupedTabIds: number[];
  source: "local";
  warnings: string[];
}

export interface UserRule {
  id: string;
  type: "domain" | "domainSuffix" | "keyword" | "urlRegex" | "titleRegex";
  pattern: string;
  groupName: string;
  color?: ChromeTabGroupColor;
  enabled: boolean;
}

export interface Settings {
  maxGroups: number;
  minTabsPerGroup: number;
  autoCollapseAfterApply: boolean;
  includePinnedTabs: boolean;
  rules: UserRule[];
}

export interface CategoryDefinition {
  id: string;
  name: string;
  color: ChromeTabGroupColor;
  domains: string[];
  domainSuffixes: string[];
  urlKeywords: string[];
  titleKeywords: string[];
  weightedKeywords: Record<string, number>;
  negativeKeywords?: string[];
  minScore: number;
}

export interface RuleMatchResult {
  matched: boolean;
  groupName?: string;
  color?: ChromeTabGroupColor;
  reason?: string;
  warning?: string;
}

export interface ScoredCategory {
  category: CategoryDefinition;
  score: number;
  matchedSignals: string[];
}
