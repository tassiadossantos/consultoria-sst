const GOV_RSS_BASE_URL = "https://www.gov.br/trabalho-e-emprego/rss.xml";
export const GOV_SST_SOURCE_URL =
  "https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/seguranca-e-saude-no-trabalho";

const GOV_SST_SEARCH_TERMS = [
  "\"Segurança e Saúde no Trabalho\"",
  "\"Normas Regulamentadoras\"",
  "\"NR-\"",
  "\"SST\"",
  "\"acidentes de trabalho\"",
  "\"eSocial S-2240\"",
] as const;

const MAX_NEWS_ITEMS = 3;
const CACHE_TTL_MS = 15 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 12_000;
const SST_NEWS_KEYWORD_REGEX =
  /\b(nr-?\d+|nr\b|seguran[cç]a|sa[úu]de|sst|fiscaliza[cç][aã]o|acidente|epi|esocial|s-2240|normas?\s+regulamentadoras?)\b/i;

export interface GovSstNewsItem {
  title: string;
  summary: string;
  link: string;
  publishedAt: string;
}

type RssItem = {
  title: string;
  description: string;
  guid: string;
  pubDate: string;
};

type CachedPayload = {
  expiresAt: number;
  items: GovSstNewsItem[];
};

let cache: CachedPayload | null = null;

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, "\"")
    .replace(/&#039;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#x([0-9a-f]+);/gi, (_match, hexCode: string) =>
      String.fromCharCode(Number.parseInt(hexCode, 16)),
    )
    .replace(/&#(\d+);/g, (_match, code: string) =>
      String.fromCharCode(Number.parseInt(code, 10)),
    )
    .replace(/\s+/g, " ")
    .trim();
}

function extractTagValue(block: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = block.match(regex);
  if (!match) {
    return "";
  }

  return decodeHtmlEntities(match[1]);
}

function parseRssItems(xmlText: string): RssItem[] {
  const items: RssItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null = itemRegex.exec(xmlText);

  while (match) {
    const block = match[1];
    items.push({
      title: extractTagValue(block, "title"),
      description: extractTagValue(block, "description"),
      guid: extractTagValue(block, "guid"),
      pubDate: extractTagValue(block, "pubDate"),
    });
    match = itemRegex.exec(xmlText);
  }

  return items;
}

function normalizeGovLink(rawLink: string): string | null {
  const trimmed = rawLink.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    if (!url.hostname.endsWith("gov.br")) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

function parsePublishedAt(rawDate: string): number {
  const timestamp = Date.parse(rawDate);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function isSstNewsCandidate(item: RssItem): boolean {
  if (!item.guid.includes("/pt-br/noticias-e-conteudo/")) {
    return false;
  }

  const text = `${item.title} ${item.description}`;
  return SST_NEWS_KEYWORD_REGEX.test(text);
}

async function fetchRssByTerm(term: string): Promise<RssItem[]> {
  const url = new URL(GOV_RSS_BASE_URL);
  url.searchParams.set("SearchableText", term);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/rss+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.5",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return [];
    }

    return parseRssItems(await response.text());
  } catch {
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getLatestGovSstNews(limit = MAX_NEWS_ITEMS): Promise<GovSstNewsItem[]> {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.items.slice(0, limit);
  }

  const dedupedByLink = new Map<string, GovSstNewsItem & { sortTimestamp: number }>();

  for (const term of GOV_SST_SEARCH_TERMS) {
    const rssItems = await fetchRssByTerm(term);
    for (const item of rssItems) {
      if (!isSstNewsCandidate(item)) {
        continue;
      }

      const link = normalizeGovLink(item.guid);
      if (!link) {
        continue;
      }

      const sortTimestamp = parsePublishedAt(item.pubDate);
      if (!sortTimestamp) {
        continue;
      }

      const normalizedItem: GovSstNewsItem & { sortTimestamp: number } = {
        title: item.title,
        summary: item.description,
        link,
        publishedAt: new Date(sortTimestamp).toISOString(),
        sortTimestamp,
      };

      const existing = dedupedByLink.get(link);
      if (!existing || existing.sortTimestamp < sortTimestamp) {
        dedupedByLink.set(link, normalizedItem);
      }
    }

    if (dedupedByLink.size >= limit * 2) {
      break;
    }
  }

  const items = Array.from(dedupedByLink.values())
    .sort((a, b) => b.sortTimestamp - a.sortTimestamp)
    .slice(0, limit)
    .map(({ sortTimestamp: _sortTimestamp, ...rest }) => rest);

  cache = {
    expiresAt: Date.now() + CACHE_TTL_MS,
    items,
  };

  return items;
}

export function clearGovSstNewsCache(): void {
  cache = null;
}
