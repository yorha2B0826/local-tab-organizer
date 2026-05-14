import { normalizeText } from "./tokenizer";
import type { RuleMatchResult, TabInfo, UserRule } from "./types";

export function matchUserRules(tab: TabInfo, rules: UserRule[]): RuleMatchResult {
  for (const rule of rules) {
    if (!rule.enabled) continue;
    const pattern = rule.pattern.trim();
    if (!pattern || !rule.groupName.trim()) continue;
    const normalizedPattern = normalizeText(pattern);
    const normalizedTitle = normalizeText(tab.title);
    const normalizedUrl = normalizeText(tab.url);
    const reason = `命中用户规则：${pattern} -> ${rule.groupName}`;

    if (rule.type === "domain" && (tab.domain === pattern.toLowerCase() || tab.domain.includes(pattern.toLowerCase()))) {
      return { matched: true, groupName: rule.groupName, color: rule.color, reason };
    }
    if (rule.type === "domainSuffix" && tab.domain.endsWith(pattern.toLowerCase())) {
      return { matched: true, groupName: rule.groupName, color: rule.color, reason };
    }
    if (rule.type === "keyword" && normalizedPattern && (normalizedTitle.includes(normalizedPattern) || normalizedUrl.includes(normalizedPattern))) {
      return { matched: true, groupName: rule.groupName, color: rule.color, reason };
    }
    if (rule.type === "urlRegex" || rule.type === "titleRegex") {
      try {
        const regex = new RegExp(pattern, "i");
        const target = rule.type === "urlRegex" ? tab.url : tab.title;
        if (regex.test(target)) {
          return { matched: true, groupName: rule.groupName, color: rule.color, reason };
        }
      } catch (error) {
        return { matched: false, warning: `用户规则正则无效：${pattern} (${error instanceof Error ? error.message : "未知错误"})` };
      }
    }
  }
  return { matched: false };
}
