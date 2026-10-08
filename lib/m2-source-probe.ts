/**
 * M2.0 source-discovery evidence only. No identities, monitored baselines,
 * editorial dispositions, policy candidates or published records are created.
 * These are HTML listing candidates, NOT validated RSS or API feeds.
 */
export const M2_CANDIDATES = [
  {
    id: "candidate-us-exim-news",
    label: "Export-Import Bank news",
    url: "https://www.exim.gov/news",
    hosts: ["www.exim.gov", "exim.gov"],
    path: /^\/news\/[^/?#]+/,
  },
  {
    id: "candidate-us-doe-cmei",
    label: "DOE Critical Minerals and Energy Innovation news listing",
    url: "https://www.energy.gov/collection/view?page=0&paragraph=822121",
    hosts: ["www.energy.gov", "energy.gov"],
    path: /^\/(?:cmei\/articles|articles)\/[^/?#]+/,
  },
  {
    id: "candidate-us-defense-ibp",
    label: "Defense Industrial Base Policy news",
    url: "https://www.businessdefense.gov/news/index.html",
    hosts: ["www.businessdefense.gov", "businessdefense.gov"],
    path: /^\/news\/(?!index\.html$)[^/?#]+/,
  },
] as const;
export type ProbeCandidate = (typeof M2_CANDIDATES)[number];
export type SourceProbeReport = {
  mode: "m2_source_discovery_only";
  checkedAt: string;
  results: {
    candidateId: ProbeCandidate["id"];
    listing: string;
    health: "reachable_html" | "unusable_html" | "blocked" | "http_error" | "network_error";
    status: number | null;
    candidateLinks: number;
    sampleLinks: { title: string; url: string }[];
    warning: string;
  }[];
};
const stripTags = (s: string) => s.replace(/<[^>]*>/g, " ").replace(/&(?:amp|#38);/g, "&")
  .replace(/&(?:quot|#34);/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&nbsp;|&#160;/g, " ").replace(/\s+/g, " ").trim();
const MAX_BYTES = 2_000_000;
const MAX_SAMPLES = 8;

export function extractOfficialArticleLinks(
  raw: string, candidate: ProbeCandidate,
): { title: string; url: string }[] {
  if (Buffer.byteLength(raw, "utf8") > MAX_BYTES) throw Error("Listing exceeds bounded probe size");
  if (!/<html\b/i.test(raw) || !/<a\b/i.test(raw)) throw Error("Not a parseable HTML listing");
  const seen = new Set<string>();
  const found: { title: string; url: string }[] = [];
  const pattern = /<a\b([^>]*?)>([\s\S]*?)<\/a\s*>/gi;
  for (const match of raw.matchAll(pattern)) {
    const href = /\bhref\s*=\s*(?:"([^"]+)"|'([^']+)')/i.exec(match[1])?.slice(1).find(Boolean);
    if (!href) continue;
    const cleanHref = href.replace(/&amp;/g, "&");
    let parsed: URL;
    try { parsed = new URL(cleanHref, candidate.url); } catch { continue; }
    if (parsed.protocol !== "https:" || parsed.username || parsed.password ||
        !candidate.hosts.includes(parsed.hostname as never) || !candidate.path.test(parsed.pathname)) continue;
    const title = stripTags(match[2]);
    if (title.length < 12 || title.length > 450) continue;
    parsed.hash = "";
    parsed.hostname = candidate.hosts[0]; // Collapse apex/www aliases under one official publisher identity.
    // URLs with different paths represent different records; ignore trackable
    // navigation-only query strings for the same official article path.
    parsed.search = "";
    const url = parsed.toString();
    if (seen.has(url)) continue;
    seen.add(url);
    found.push({ title, url });
  }
  return found;
}

export async function probeM2SourceCandidates(
  checkedAt: string,
  fetchFn: typeof fetch = fetch,
): Promise<SourceProbeReport> {
  const results: SourceProbeReport["results"] = [];
  for (const candidate of M2_CANDIDATES) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetchFn(candidate.url, {
        signal: controller.signal, redirect: "follow",
        headers: { accept: "text/html", "user-agent": "SMPT-source-discovery/1.0 (read-only index reachability check)" },
      });
      const finalUrl = new URL(response.url || candidate.url);
      if (finalUrl.protocol !== "https:" || !candidate.hosts.includes(finalUrl.hostname as never)) {
        throw Error("Redirect left the expected official-source host");
      }
      if (!response.ok) {
        results.push({
          candidateId: candidate.id, listing: candidate.url,
          health: [401, 403, 429, 451].includes(response.status) ? "blocked" : "http_error",
          status: response.status, candidateLinks: 0, sampleLinks: [],
          warning: "HTTP response is not a successful listing; not eligible for monitoring activation",
        });
        continue;
      }
      const kind = response.headers.get("content-type") ?? "";
      const raw = await response.text();
      const links = kind.includes("text/html") || /<html\b/i.test(raw)
        ? extractOfficialArticleLinks(raw, candidate) : [];
      results.push({
        candidateId: candidate.id, listing: candidate.url,
        health: links.length >= 3 ? "reachable_html" : "unusable_html",
        status: response.status,
        candidateLinks: links.length, sampleLinks: links.slice(0, MAX_SAMPLES),
        warning: "HTML link-shape test ONLY: no stable feed/cursor, dates, publication identity, or 7-day continuity verified",
      });
    } catch (error) {
      results.push({
        candidateId: candidate.id, listing: candidate.url,
        health: "network_error", status: null, candidateLinks: 0, sampleLinks: [],
        warning: "No reliable listing evidence: " + ((error as Error).name === "AbortError" ? "request timeout" :
          (error as Error).message.slice(0, 120)),
      });
    } finally { clearTimeout(timeout); }
  }
  return { mode: "m2_source_discovery_only", checkedAt, results };
}
