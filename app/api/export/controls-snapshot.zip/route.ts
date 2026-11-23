import JSZip from "jszip";
import { buildControlsSnapshotBundle } from "@/lib/controls-snapshot";

export const dynamic = "force-static";

export async function GET() {
  const { manifest, files } = buildControlsSnapshotBundle();
  const archive = new JSZip();
  const date = new Date(`${manifest.asOf}T00:00:00Z`);
  for (const { name, content } of files) archive.file(name, content, { date });

  const body = await archive.generateAsync({ type: "uint8array", compression: "DEFLATE" });
  return new Response(Uint8Array.from(body), {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="smpt-controls-${manifest.asOf}.zip"`,
    },
  });
}
