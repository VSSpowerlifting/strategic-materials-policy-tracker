/** F5-5 offline, private source-version comparison. No source fetch or publication. */
import { createHash } from "node:crypto";
import type { F5DriftCase } from "./f5-source-drift";
export type VersionRow = { kind: "context" | "changed" | "removed" | "added"; before: string | null; after: string | null };
export type PrivateVersionHandoff = {
  schemaVersion: "f5-5-private-version-handoff-1";
  mode: "offline_private_human_review_only";
  sourceId: string; publisher: string; officialUrl: string; reviewKey: string;
  reasons: readonly string[];
  previous: { sha256: string; retrievedAt: string; publicationDate: string | null };
  current: { sha256: string; retrievedAt: string; publicationDate: string | null };
  rows: VersionRow[]; omittedUnchanged: number; rawOnlyChange: boolean;
  sourceAccessVerified: false; reviewVerdict: "unreviewed"; reviewerIdentity: null;
  reviewedAt: null; entityLinksAdjudicated: false; publicReleaseAuthorized: false;
  automatedPromotionAuthorized: false; reviewerChecks: readonly string[];
};
const sha = (s: string) => createHash("sha256").update(s, "utf8").digest("hex");
