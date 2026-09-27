import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Strategic Materials Policy Tracker — a source-linked record of critical minerals policy";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const mark = await readFile(join(process.cwd(), "public/brand/smpt-lattice-mark.png"));

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        position: "relative",
        backgroundColor: "#10171b",
        color: "#f3eee2",
        fontFamily: "Arial, sans-serif",
        padding: "68px 76px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: 720,
          height: "100%",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", color: "#ffca64", fontSize: 20, fontWeight: 700, letterSpacing: 3 }}>
          SMPT / THE POLICY RECORD
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 64, fontWeight: 700, lineHeight: 1.06, letterSpacing: -2 }}>
          <span>Strategic Materials</span>
          <span>Policy Tracker</span>
        </div>
        <div style={{ display: "flex", maxWidth: 675, fontSize: 27, lineHeight: 1.3, color: "#d1c9b9" }}>
          Source-linked government controls, public commitments and project designations across rare earths and strategic materials.
        </div>
        <div style={{ display: "flex", color: "#ffca64", fontSize: 19, letterSpacing: 0.5 }}>
          strategic-materials-policy-tracker.vercel.app
        </div>
      </div>
      <img
        alt=""
        src={`data:image/png;base64,${mark.toString("base64")}`}
        style={{ position: "absolute", width: 460, height: 406, top: 115, right: -45, opacity: 0.9 }}
      />
    </div>,
    size,
  );
}
