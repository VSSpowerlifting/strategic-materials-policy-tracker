import JSZip from "jszip";
import { buildPublishedControlsSnapshotBundle } from "@/lib/published-controls-download";
import { ControlsIntegrityError, sha256Hex } from "@/lib/controls-release-archive";

export const dynamic = "force-static";

export async function GET() {
  const { manifest, files, zipSha256 } = buildPublishedControlsSnapshotBundle();
  const archive = new JSZip();
  const date = new Date(`${manifest.asOf}T00:00:00Z`);
  for (const { name, content } of files) archive.file(name, content, { date });

  const body = await archive.generateAsync({ type: "uint8array", compression: "DEFLATE" });
  if (sha256Hex(body) !== zipSha256) {
    throw new ControlsIntegrityError("published Controls ZIP does not match its release pin");
  }
  return new Response(Uint8Array.from(body), {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="smpt-controls-${manifest.asOf}.zip"`,
    },
  });
}
