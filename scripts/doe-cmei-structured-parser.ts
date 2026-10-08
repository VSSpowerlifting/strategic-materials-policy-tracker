/**
 * DOE CMEI M2.7 structured-source admission gate.
 * Proven live DOM structures: #37820293673 (collection--page / collection-item
 * title, date, office and article about schema:Article/display-date).
 *
 * PURE parse only: no network, persistence, editorial classification or finance.
 * A validated publisher date here is still NOT a policy event or funding fact.
 */
const MAX_HTML_BYTES = 2_000_000;
const MONTHS: Record<string, string> = {
  January: "01", February: "02", March: "03", April: "04", May: "05", June: "06",
  July: "07", August: "08", September: "09", October: "10", November: "11", December: "12",
};
const DATE = /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(20\d\d)$/;
export type DoeCmeiRow = {
  officialUrl: string;
  title: string;
  publicationDate: string;
  issuingOffice: string;
  documentType: string;
};
export type DoeCmeiHeader = {
  officialUrl: string;
  title: string;
  publicationDate: string;
  issuingOffice: string;
  articleBoundaryConfirmed: true;
  bodyBoundaryConfirmed: false;
};

function decodeHtml(input: string): string {
  return input.replace(/&(?:amp|quot|apos|nbsp|#39|#x27|rsquo|lsquo|ldquo|rdquo|mdash|ndash|#[0-9]+|#x[0-9a-f]+);/gi,
    (entity) => {
      const named: Record<string, string> = {
        "&amp;": "&", "&quot;": '"', "&apos;": "'", "&nbsp;": " ",
        "&#39;": "'", "&#x27;": "'", "&rsquo;": "’", "&lsquo;": "‘",
        "&ldquo;": "“", "&rdquo;": "”", "&mdash;": "—", "&ndash;": "–",
      };
      const key = entity.toLowerCase();
      if (named[key] !== undefined) return named[key];
      if (key.startsWith("&#")) {
        const point = key.startsWith("&#x")
          ? parseInt(key.slice(3, -1), 16) : parseInt(key.slice(2, -1), 10);
        if (Number.isInteger(point) && point > 0 && point <= 0x10ffff &&
            !(point >= 0xd800 && point <= 0xdfff)) return String.fromCodePoint(point);
      }
      return entity;
    });
}
function text(html: string): string {
  return decodeHtml(html.replace(/<(?:script|style|noscript)\b[^>]*>[\s\S]*?<\/(?:script|style|noscript)>/gi, " ")
    .replace(/<[^>]*>/g, " ").replace(/\s+/g, " ")).trim();
}
function bounded(html: string): void {
  if (!/<html\b/i.test(html) || Buffer.byteLength(html, "utf8") > MAX_HTML_BYTES)
    throw Error("DOE structured source requires bounded official HTML");
}
function mainOnly(html: string): string {
  const matches = [...html.matchAll(/<main\b[^>]*>([\s\S]*?)<\/main\s*>/gi)];
  if (matches.length !== 1) throw Error("DOE structured source requires exactly one main landmark");
  return matches[0][1];
}
function classes(attributes: string, cls: string): boolean {
  const match = /\bclass\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attributes);
  return !!match && (match[1] ?? match[2]).split(/\s+/).includes(cls);
}
function attr(attrs: string, name: string): string | null {
  const pattern = new RegExp("\\b" + name + "\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)')", "i");
  const match = pattern.exec(attrs);
  return match ? (match[1] ?? match[2]) : null;
}
function officialUrl(raw: string, base: string): string {
  let url: URL;
  try { url = new URL(decodeHtml(raw), base); } catch { throw Error("DOE article URL invalid"); }
  if (url.protocol !== "https:" || !["www.energy.gov","energy.gov"].includes(url.hostname) ||
    !!url.username || !!url.password || !!url.port || !!url.hash || !!url.search ||
    !/^\/(?:cmei\/articles|articles)\/[a-z0-9][a-z0-9-]+\/?$/i.test(url.pathname))
    throw Error("DOE article link not official canonical article");
  url.hostname = "www.energy.gov";
  url.pathname = url.pathname.replace(/\/$/, "");
  return url.toString();
}
function date(value: string): string {
  const match = DATE.exec(value.trim());
  if (!match) throw Error("DOE requires a unique publisher-visible calendar date");
  const out = match[3] + "-" + MONTHS[match[1]] + "-" + match[2].padStart(2, "0");
  const d = new Date(out + "T00:00:00Z");
  if (!Number.isFinite(d.getTime()) || d.toISOString().slice(0, 10) !== out)
    throw Error("DOE listing date impossible");
  return out;
}
function uniqueTagged(
  html: string, tag: "div" | "span" | "p", cls: string,
): string {
  const open = new RegExp("<" + tag + "\\b([^>]*)>", "gi");
  const matches = [...html.matchAll(open)].filter((x) => classes(x[1], cls));
  if (matches.length !== 1) throw Error("DOE expected exactly one " + cls + " field");
  const m = matches[0];
  const innerStart = (m.index ?? 0) + m[0].length;
  // DOE article fields contain nested divs, e.g. icons and read-time.
  // Non-greedy </div> would truncate the actual parent field.
  const tags = new RegExp("<\\/?" + tag + "\\b[^>]*>", "gi");
  tags.lastIndex = m.index ?? 0;
  let depth = 0;
  let next: RegExpExecArray | null;
  while ((next = tags.exec(html))) {
    if (next[0].startsWith("</")) depth--;
    else depth++;
    if (depth === 0)
      return html.slice(innerStart, next.index);
  }
  throw Error("DOE " + cls + " field has unbalanced " + tag + " markup");
}
/**
 * Find every publisher-classed UL/LI regardless of nested peer lists.
 *
 * A non-greedy /<ul>...<\/ul>/ iterator consumes an outer list all the
 * way through the first inner closing tag. The real DOE Drupal template
 * may include other <ul> structures within main; as a result, a regex
 * iterator can silently skip collection--page and report zero cards.
 * Match opening tags independently and close same-tag boundaries by depth.
 */
function classedElements(html: string, tag: "ul" | "li", className: string): string[] {
  const openings = [...html.matchAll(new RegExp("<" + tag + "\\b([^>]*)>", "gi"))]
    .filter((m) => classes(m[1], className));
  const elements: string[] = [];
  for (const opener of openings) {
    const begin = opener.index ?? 0;
    const innerStart = begin + opener[0].length;
    const parts = new RegExp("<\\/?" + tag + "\\b[^>]*>", "gi");
    parts.lastIndex = begin;
    let depth = 0;
    let part: RegExpExecArray | null;
    let closed = false;
    while ((part = parts.exec(html))) {
      if (/^<\//.test(part[0])) depth--;
      else depth++;
      if (depth < 0) throw Error("DOE invalid " + tag + " structural nesting");
      if (depth === 0) {
        elements.push(html.slice(innerStart, part.index));
        closed = true;
        break;
      }
    }
    if (!closed) throw Error("DOE unbalanced " + tag + " " + className + " boundary");
  }
  return elements;
}

export function parseDoeStructuredListing(html: string, requestedUrl: string): DoeCmeiRow[] {
  bounded(html);
  const base = new URL(requestedUrl);
  if (base.origin !== "https://www.energy.gov" ||
      base.pathname !== "/collection/view" ||
      base.searchParams.get("paragraph") !== "822121" ||
      !["0","1"].includes(base.searchParams.get("page") ?? "") ||
      [...base.searchParams.keys()].some((key) => !["page", "paragraph"].includes(key)))
    throw Error("DOE structured parser restricted to two known CMEI index pages");
  const main = mainOnly(html);
  const lists = classedElements(main, "ul", "collection--page");
  if (lists.length !== 1) throw Error("DOE source missing unique filtered collection--page");
  const children = classedElements(lists[0], "li", "collection-item");
  if (children.length !== 10)
    throw Error("DOE first two CMEI index pages require ten explicit listing cards: observed " + children.length);
  const seen = new Set<string>();
  const rows: DoeCmeiRow[] = [];
  for (const card of children) {
    const links = [...card.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi)]
      .filter((a) => classes(a[1], "collection-item__link"));
    if (links.length !== 1)
      throw Error("DOE listing card missing unique collection-item__link");
    const href = attr(links[0][1], "href");
    if (!href) throw Error("DOE listing headline missing official href");
    const canonical = officialUrl(href, requestedUrl);
    const title = text(links[0][2]);
    if (title.length < 12 || title.length > 500)
      throw Error("DOE listing title has invalid length");
    const dateRaw = text(uniqueTagged(card, "div", "collection-item__date"));
    const officeRaw = text(uniqueTagged(card, "div", "collection-item__office"));
    if (officeRaw !== "Office of Critical Minerals and Energy Innovation")
      throw Error("DOE CMEI filtered row lacks verified issuing office");
    const typ = text(uniqueTagged(card, "div", "collection-item__icon_type"));
    if (!typ || typ.length > 120)
      throw Error("DOE filtered row lacks publisher document type");
    if (seen.has(canonical)) throw Error("DOE duplicate official publication URL in index");
    seen.add(canonical);
    rows.push({officialUrl:canonical, title, publicationDate:date(dateRaw),
      issuingOffice:officeRaw, documentType:typ});
  }
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].publicationDate > rows[i-1].publicationDate)
      throw Error("DOE listing date order changed; refuse an unbounded rollover inference");
  }
  return rows;
}
export function validateDoePagination(a: readonly DoeCmeiRow[], b: readonly DoeCmeiRow[]): void {
  if (a.length !== 10 || b.length !== 10)
    throw Error("DOE page 0/page 1 incomplete");
  const ids = new Set(a.map((x) => x.officialUrl));
  if (b.some((x) => ids.has(x.officialUrl)))
    throw Error("DOE CMEI two-page same-publication overlap");
  if (a.at(-1)!.publicationDate < b[0].publicationDate)
    throw Error("DOE index pages not chronologically ordered");
}
export function parseDoeStructuredArticleHeader(
  html: string, officialArticle: string,
): DoeCmeiHeader {
  bounded(html);
  const canonical = officialUrl(officialArticle, officialArticle);
  const main = mainOnly(html);
  const articles = [...main.matchAll(/<article\b([^>]*)>([\s\S]*?)<\/article\s*>/gi)]
    .filter((m) => (attr(m[1], "typeof") ?? "").split(/\s+/).includes("schema:Article") &&
      attr(m[1], "about") !== null);
  if (articles.length !== 1)
    throw Error("DOE article requires one schema:Article main-body boundary");
  if (officialUrl(attr(articles[0][1], "about")!, officialArticle) !== canonical)
    throw Error("DOE schema:Article publisher URL differs from index");
  const headings = [...main.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1\s*>/gi)];
  if (headings.length !== 1)
    throw Error("DOE article lacks unique publisher H1");
  const article = articles[0][2];
  // Crucially: article:published_time and sitewide nav dates are NOT a DOE
  // publisher-visible release date. Scope to this article's beneath-title.
  const beneath = uniqueTagged(article, "div", "beneath-title");
  const displayed = text(uniqueTagged(beneath, "span", "display-date"));
  const office = text(uniqueTagged(beneath, "p", "primary-office"));
  if (office !== "Office of Critical Minerals and Energy Innovation")
    throw Error("DOE article lacks unique CMEI primary-office attribution");
  const headline = text(headings[0][1]);
  if (headline.length < 12 || headline.length > 500)
    throw Error("DOE article official H1 invalid");
  return {officialUrl:canonical, title:headline, publicationDate:date(displayed),
    issuingOffice:office, articleBoundaryConfirmed:true, bodyBoundaryConfirmed:false};
}
export function compareDoeOfficialHeader(
  listed: DoeCmeiRow, header: DoeCmeiHeader,
): void {
  if (listed.officialUrl !== header.officialUrl ||
      listed.title.normalize("NFKC").trim() !== header.title.normalize("NFKC").trim() ||
      listed.publicationDate !== header.publicationDate ||
      listed.issuingOffice !== header.issuingOffice)
    throw Error("DOE official article headline/date/issuer mismatches its listed source card");
}
