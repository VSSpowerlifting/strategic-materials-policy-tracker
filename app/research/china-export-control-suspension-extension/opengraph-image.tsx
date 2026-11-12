import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { photographs } from "@/lib/photography";

export const alt =
  "SMPT Policy Research: China extends its export-control pause through January 10, 2027";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const mark = await readFile(join(process.cwd(), "public/brand/smpt-lattice-mark.png"));

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: "#f6f5f1",
        color: "#1b1e21",
        fontFamily: "Arial, sans-serif",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: 10,
          backgroundColor: "#1f5c4d",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: 790,
          padding: "66px 0 60px 76px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            color: "#1f5c4d",
            fontSize: 21,
            fontWeight: 700,
            letterSpacing: 2.2,
          }}
        >
          SMPT   /   POLICY RESEARCH
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 23 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 61,
              fontWeight: 700,
              lineHeight: 1.07,
              letterSpacing: -1.8,
            }}
          >
            <span>China Extends Its</span>
            <span>Export-Control Pause</span>
          </div>
          <div
            style={{
              display: "flex",
              maxWidth: 730,
              fontSize: 30,
              lineHeight: 1.25,
              color: "#555b61",
            }}
          >
            Six October 2025 measures remain suspended through January 10, 2027
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: 0.6,
            color: "#555b61",
          }}
        >
          NOVEMBER 9, 2026   ·   STRATEGIC MATERIALS POLICY TRACKER
        </div>
      </div>
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 90,
          left: 817,
          height: 435,
          width: 1,
          backgroundColor: "#b5b1a5",
        }}
      />
      <img
        alt=""
        src={photographs["china-rare-earths"].src}
        style={{
          position: "absolute",
          left: 818,
          top: 0,
          width: 382,
          height: 630,
          objectFit: "cover",
          objectPosition: "56% 50%",
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: 818,
          bottom: 0,
          width: 382,
          padding: "12px 18px",
          backgroundColor: "rgba(20, 30, 28, 0.82)",
          color: "#fff",
          fontSize: 13,
        }}
      >
        Kevnmh · CC BY-SA 4.0
      </div>
      <img
        alt=""
        src={`data:image/png;base64,${mark.toString("base64")}`}
        style={{
          position: "absolute",
          width: 390,
          height: 345,
          top: 158,
          right: -130,
          opacity: 0,
        }}
      />
    </div>,
    size,
  );
}
