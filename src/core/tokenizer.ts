export const stopWords = new Set([
  "the", "a", "an", "and", "or", "of", "to", "for", "in", "on", "with", "by", "from", "is", "are", "be",
  "page", "home", "login", "search", "official", "website", "app", "new",
  "的", "了", "和", "与", "或", "在", "是", "为", "首页", "登录", "搜索", "官网", "官方", "应用", "新建"
]);

export function normalizeText(text: string): string {
  let decoded = text;
  try {
    decoded = decodeURIComponent(text);
  } catch {
    decoded = text;
  }
  return decoded
    .toLowerCase()
    .replace(/[-_/\\?#=&:()[\]{}.,;'"`~!@$%^*+|<>]/g, " ")
    .replace(/[^\p{Script=Han}a-z0-9\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function chineseNgrams(segment: string): string[] {
  const chars = Array.from(segment);
  const tokens: string[] = [];
  if (chars.length <= 1) return tokens;
  for (let n = 2; n <= 3; n += 1) {
    for (let i = 0; i <= chars.length - n; i += 1) {
      tokens.push(chars.slice(i, i + n).join(""));
    }
  }
  return tokens;
}

export function tokenize(text: string): string[] {
  const normalized = normalizeText(text);
  const tokens = new Set<string>();
  for (const rawPart of normalized.split(/\s+/).filter(Boolean)) {
    const parts = rawPart.match(/[\p{Script=Han}]+|[a-z0-9]+/gu) ?? [];
    for (const part of parts) {
      if (/^[\p{Script=Han}]+$/u.test(part)) {
        for (const token of chineseNgrams(part)) {
          if (!stopWords.has(token)) tokens.add(token);
        }
      } else if ((part.length >= 2 || /^[a-z]+\d+|\d+[a-z]+$/i.test(part)) && !stopWords.has(part)) {
        tokens.add(part);
      }
    }
  }
  return [...tokens];
}
