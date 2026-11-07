// Repository paths for the exhibit system. Pure.
import path from "node:path";

export const REPO = path.resolve(__dirname, "..", "..");
export const SYSTEM_DIR = path.join(REPO, "docs", "design", "presentations", "exhibit-system");
export const PATTERNS_DIR = path.join(SYSTEM_DIR, "patterns");
export const FIXTURES_DIR = path.join(SYSTEM_DIR, "fixtures");
export const GALLERY_DIR = path.join(SYSTEM_DIR, "gallery");
export const PREVIEWS_DIR = path.join(GALLERY_DIR, "previews");
export const REGISTRY_FILE = path.join(SYSTEM_DIR, "exhibit-registry.json");
export const GALLERY_PPTX = path.join(SYSTEM_DIR, "exhibit-gallery.pptx");
export const DEMO_DECK_SPEC = path.join(SYSTEM_DIR, "demo-deck.json");
export const DEMO_PPTX = path.join(SYSTEM_DIR, "demo-deck.pptx");
export const MANIFEST_FILE = path.join(SYSTEM_DIR, "element-manifest.json");
export const EDITABILITY_REPORT = path.join(SYSTEM_DIR, "editability-report.json");
