const SITE_NAMES: Record<string, string> = {
  "github.com": "GitHub",
  "bilibili.com": "Bilibili",
  "youtube.com": "YouTube",
  "zhihu.com": "知乎",
  "docs.google.com": "Google Docs",
  "drive.google.com": "Google Drive",
  "mail.google.com": "Gmail",
  "developer.mozilla.org": "MDN",
  "developer.chrome.com": "Chrome Docs",
  "arxiv.org": "arXiv",
  "cnki.net": "知网"
};

export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function getSiteName(domain: string): string {
  const normalized = domain.toLowerCase().replace(/^www\./, "");
  if (SITE_NAMES[normalized]) return SITE_NAMES[normalized];

  const matchedKnown = Object.entries(SITE_NAMES).find(([known]) => normalized.endsWith(`.${known}`));
  if (matchedKnown) return matchedKnown[1];

  const parts = normalized.split(".").filter(Boolean);
  const main = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
  if (!main) return "相关标签";
  return main
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "相关标签";
}
