import { ImageResponse } from "next/og";

/**
 * Article previews share the main site's plaster, graphite, malachite, and
 * topographic-landscape visual language. This is illustrative artwork,
 * not a photograph of a specific mine or project.
 */
export const alt =
  "SMPT Policy Research — China extends the suspension of six export-control announcements through January 10, 2027";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PLASTER = "#f6f5f1";
const GRAPHITE = "#1b1e21";
const MUTED = "#555b61";
const RULE = "#b5b1a5";
const MALACHITE = "#1f5c4d";
const TERRACE_COLORS = [
  "#8d9a83", "#86957d", "#768879", "#697f70",
  "#587366", "#49675e", "#3e5d54", "#36544c",
  "#2b4a43", "#23443e", "#1a3733", "#18332f",
];

function contourPath(cx: number, cy: number, rx: number, ry: number, phase: number, seed: number): string {
  const theta = -0.31;
  const coordinates: string[] = [];
  for (let k = 0; k <= 140; k++) {
    const a = (2 * Math.PI * k) / 140;
    const p = 1 + 0.043 * Math.sin(3 * a + 0.4 + phase)
      + 0.028 * Math.cos(7 * a + seed)
      + 0.018 * Math.sin(11 * a + phase);
    const x = rx * p * Math.cos(a);
    const y = ry * p * Math.sin(a);
    const xx = cx + x * Math.cos(theta) - y * Math.sin(theta);
    const yy = cy + x * Math.sin(theta) + y * Math.cos(theta);
    coordinates.push(`${k === 0 ? "M" : "L"}${xx.toFixed(1)} ${yy.toFixed(1)}`);
  }
  return coordinates.join(" ") + " Z";
}

function landscapeSvg(): string {
  const rings = TERRACE_COLORS.map((color, i) => {
    const d = contourPath(216, 223, 228 - i * 17.4, 157 - i * 11.9, 0.28 * i, 0.5 * i);
    const opacity = (0.55 - i * 0.025).toFixed(3);
    return `<path d="${d}" fill="${color}" stroke="#c9d0ae" stroke-opacity="${opacity}" stroke-width="${i < 7 ? 1.4 : 1.0}"/>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="430" height="456" viewBox="0 0 430 456">
    <defs>
      <linearGradient id="haze" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9ca88f"/><stop offset="1" stop-color="#25483f"/></linearGradient>
      <pattern id="survey" width="27" height="27" patternUnits="userSpaceOnUse"><path d="M27 0L0 0 0 27" fill="none" stroke="#e9e8d5" stroke-opacity=".10" stroke-width=".6"/></pattern>
      <radialGradient id="glow" cx=".30" cy=".18" r=".90"><stop offset="0" stop-color="#f2e3bb" stop-opacity=".21"/><stop offset="1" stop-color="#001a17" stop-opacity=".46"/></radialGradient>
    </defs>
    <rect width="430" height="456" fill="url(#haze)"/>
    <rect width="430" height="456" fill="url(#survey)"/>
    <g transform="translate(-2,16)">${rings}</g>
    <path d="M0 0H430V456H0Z" fill="url(#glow)"/>
    <path d="M-10 394C102 346 154 347 233 397S366 435 454 399" fill="none" stroke="#f0e4c7" stroke-opacity=".35" stroke-width="1.3"/>
    <path d="M-10 413C95 360 156 376 222 415S345 452 450 419" fill="none" stroke="#f0e4c7" stroke-opacity=".18" stroke-width=".8"/>
    <circle cx="340" cy="93" r="12" fill="none" stroke="#f5f0dc" stroke-opacity=".75" stroke-width="1"/>
    <path d="M340 74V111M320 93H359" stroke="#f5f0dc" stroke-opacity=".55" stroke-width=".8"/>
    <path d="M22 24H58M22 24V60M408 432H372M408 432V396" fill="none" stroke="#f6f0df" stroke-opacity=".5" stroke-width="1"/>
  </svg>`;
}

const landscape = `data:image/svg+xml;base64,${btoa(landscapeSvg())}`;

export default function Image() {
  return new ImageResponse(
    <div style={{ display: "flex", position: "relative", width: "100%", height: "100%", backgroundColor: PLASTER, color: GRAPHITE }}>
      <div style={{ display: "flex", position: "absolute", left: 62, top: 53, fontFamily: "Arial, sans-serif", fontSize: 15, fontWeight: 600, letterSpacing: 3, color: MALACHITE }}>SMPT / POLICY RESEARCH</div>
      <div style={{ display: "flex", position: "absolute", right: 62, top: 55, fontFamily: "Arial, sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: 2, color: "#515c55" }}>RESEARCH / NOVEMBER 2026</div>
      <div style={{ position: "absolute", left: 62, top: 94, width: 1076, height: 1, backgroundColor: RULE }} />

      <div style={{ display: "flex", flexDirection: "column", position: "absolute", left: 62, top: 153, width: 715, fontFamily: "Georgia, serif", fontSize: 62, lineHeight: 1.05, letterSpacing: -1.9, fontWeight: 400 }}>
        <span>China Extends the</span>
        <span>Suspension of Six</span>
        <span>Export-Control</span>
        <span>Announcements</span>
      </div>
      <div style={{ position: "absolute", left: 65, top: 446, width: 62, height: 3, backgroundColor: MALACHITE }} />
      <div style={{ display: "flex", position: "absolute", left: 66, top: 469, width: 690, fontFamily: "Arial, sans-serif", fontSize: 24, color: MUTED }}>
        Through January 10, 2027
      </div>

      <div style={{ display: "flex", position: "absolute", left: 790, top: 126, width: 347, height: 395, overflow: "hidden", border: "1px solid #647b67", backgroundColor: "#446157" }}>
        {/* This terrain illustration matches the main-site social-card motif. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={landscape} alt="" width="347" height="395" style={{ width: 347, height: 395, objectFit: "cover" }} />
        <div style={{ display: "flex", position: "absolute", left: 16, top: 14, color: "#f0eee3", fontFamily: "Arial, sans-serif", letterSpacing: 2.2, fontSize: 12 }}>FIG. 01 / POLICY</div>
        <div style={{ display: "flex", position: "absolute", left: 17, bottom: 15, color: "#f0eee3", fontFamily: "Arial, sans-serif", letterSpacing: 1.6, fontSize: 12 }}>STRATEGIC MATERIALS</div>
      </div>
      <div style={{ position: "absolute", left: 62, right: 62, top: 551, height: 1, backgroundColor: RULE }} />
      <div style={{ display: "flex", position: "absolute", left: 62, top: 575, fontFamily: "Arial, sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: 2, color: "#56625b" }}>POLICY / CAPITAL / INDUSTRY</div>
      <div style={{ display: "flex", position: "absolute", right: 62, top: 575, fontFamily: "Arial, sans-serif", fontSize: 13, fontWeight: 600, color: MALACHITE }}>strategic-materials-policy-tracker.vercel.app</div>
    </div>,
    size,
  );
}
