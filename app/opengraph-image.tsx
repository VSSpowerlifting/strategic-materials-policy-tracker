import { ImageResponse } from "next/og";

export const alt = "Strategic Materials Policy Tracker — a source-linked record of critical minerals policy";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The site's light tokens, written out because the image renderer reads no stylesheet.
const PLASTER = "#f6f5f1";
const GRAPHITE = "#1b1e21";
const MUTED = "#555b61";
const RULE = "#b5b1a5";
const MALACHITE = "#1f5c4d";
const OXIDE = "#9a3324";
const OCHRE = "#9a6a12";

/** The three record marks the site uses everywhere: circle, square, rotated square. */
const MARKS = [
  { label: "Public commitments", color: MALACHITE, radius: 9, rotate: 0 },
  { label: "Control clauses", color: OXIDE, radius: 0, rotate: 0 },
  { label: "Project designations", color: OCHRE, radius: 0, rotate: 45 },
] as const;

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        backgroundColor: PLASTER,
        color: GRAPHITE,
        // No font file is fetched or bundled: the renderer's built-in face is used at regular weight.
        fontFamily: "Georgia, serif",
        padding: "64px 76px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 760, height: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", fontSize: 21, color: MUTED }}>
          <div style={{ display: "flex", width: 44, height: 2, backgroundColor: MALACHITE, marginRight: 18 }} />
          SMPT
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 76, fontWeight: 400, lineHeight: 1.04, letterSpacing: -2.2 }}>
          <span>Strategic Materials</span>
          <span>Policy Tracker</span>
        </div>
        <div style={{ display: "flex", maxWidth: 700, fontSize: 27, lineHeight: 1.35, color: MUTED }}>
          Source-linked government controls, public commitments and project designations across rare earths and strategic materials.
        </div>
        <div style={{ display: "flex", fontSize: 19, color: MALACHITE }}>
          strategic-materials-policy-tracker.vercel.app
        </div>
      </div>

      <div style={{ display: "flex", width: 1, height: "100%", backgroundColor: RULE, marginLeft: 44 }} />

      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", marginLeft: 44, width: 244 }}>
        {MARKS.map((m, i) => (
          <div
            key={m.label}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "22px 0",
              borderTop: `1px solid ${RULE}`,
              borderBottom: i === MARKS.length - 1 ? `1px solid ${RULE}` : "none",
              fontSize: 21,
              color: GRAPHITE,
            }}
          >
            <div
              style={{
                display: "flex",
                width: 18,
                height: 18,
                marginRight: 18,
                backgroundColor: m.color,
                borderRadius: m.radius,
                transform: `rotate(${m.rotate}deg)`,
              }}
            />
            {m.label}
          </div>
        ))}
      </div>
    </div>,
    size,
  );
}
