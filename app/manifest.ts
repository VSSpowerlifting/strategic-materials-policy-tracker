import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/** Web app manifest: the name, the plaster ground and the generated icons (`npm run brand:build`). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name}: ${site.descriptor}`,
    short_name: site.shortName,
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#f6f5f1",
    theme_color: "#f6f5f1",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
