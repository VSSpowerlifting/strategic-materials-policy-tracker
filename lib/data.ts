/**
 * Read-only data access for the MVP. All data is local seed JSON — no live
 * APIs, no database. Loaders return typed records and never mutate the seed.
 */
import type {
  FramingCategory,
  FramingClaim,
  Jurisdiction,
  JurisdictionCode,
  Material,
  PolicyEvent,
  Source,
} from "./types";

import eventsSeed from "@/data/seed/events.json";
import framingSeed from "@/data/seed/framing.json";
import materialsSeed from "@/data/seed/materials.json";
import jurisdictionsSeed from "@/data/seed/jurisdictions.json";
import sourcesSeed from "@/data/seed/sources.json";

const events = eventsSeed as PolicyEvent[];
const framing = framingSeed as FramingClaim[];
const materials = materialsSeed as Material[];
const jurisdictions = jurisdictionsSeed as Jurisdiction[];
const sources = sourcesSeed as Source[];

// Sort helper: most recent first.
const byDateDesc = (a: PolicyEvent, b: PolicyEvent) => b.date.localeCompare(a.date);

// --- Events -----------------------------------------------------------------

export function getAllEvents(): PolicyEvent[] {
  return [...events].sort(byDateDesc);
}

export function getEventById(id: string): PolicyEvent | undefined {
  return events.find((e) => e.id === id);
}

export function getEventsByMaterial(materialId: string): PolicyEvent[] {
  return getAllEvents().filter((e) => e.affectedMaterialIds.includes(materialId));
}

export function getEventsByActor(actor: JurisdictionCode): PolicyEvent[] {
  return getAllEvents().filter((e) => e.jurisdiction === actor);
}

/** Other events touching at least one of the same materials (excludes self). */
export function getRelatedEvents(event: PolicyEvent, limit = 6): PolicyEvent[] {
  const materialSet = new Set(event.affectedMaterialIds);
  return getAllEvents()
    .filter(
      (e) => e.id !== event.id && e.affectedMaterialIds.some((m) => materialSet.has(m)),
    )
    .slice(0, limit);
}

// --- Framing claims ---------------------------------------------------------

export function getAllFramingClaims(): FramingClaim[] {
  return framing;
}

export function getFramingByEvent(eventId: string): FramingClaim[] {
  return framing.filter((f) => f.eventId === eventId);
}

export function getFramingByCategory(category: FramingCategory): FramingClaim[] {
  return framing.filter((f) => f.category.includes(category));
}

/** All framing claims grouped by category, in the canonical category order. */
export function getFramingGroupedByCategory(): { category: FramingCategory; claims: FramingClaim[] }[] {
  const map = new Map<FramingCategory, FramingClaim[]>();
  for (const claim of framing) {
    for (const category of claim.category) {
      const list = map.get(category) ?? [];
      list.push(claim);
      map.set(category, list);
    }
  }
  return [...map.entries()]
    .map(([category, claims]) => ({ category, claims }))
    .sort((a, b) => b.claims.length - a.claims.length);
}

// --- Materials --------------------------------------------------------------

export function getAllMaterials(): Material[] {
  return [...materials].sort((a, b) => a.nameEn.localeCompare(b.nameEn));
}

export function getMaterialBySlug(slug: string): Material | undefined {
  return materials.find((m) => m.slug === slug);
}

export function getMaterialsByIds(ids: string[]): Material[] {
  return ids
    .map((id) => materials.find((m) => m.id === id))
    .filter((m): m is Material => Boolean(m));
}

// --- Jurisdictions ----------------------------------------------------------

export function getAllJurisdictions(): Jurisdiction[] {
  return jurisdictions;
}

export function getJurisdictionByCode(code: string): Jurisdiction | undefined {
  return jurisdictions.find((j) => j.code.toLowerCase() === code.toLowerCase());
}

export function getJurisdictionById(id: string): Jurisdiction | undefined {
  return jurisdictions.find((j) => j.id === id);
}

// --- Sources ----------------------------------------------------------------

export function getAllSources(): Source[] {
  return [...sources].sort((a, b) => a.title.localeCompare(b.title));
}

export function getSourceById(id: string): Source | undefined {
  return sources.find((s) => s.id === id);
}

export function getSourcesByIds(ids: string[]): Source[] {
  return ids
    .map((id) => sources.find((s) => s.id === id))
    .filter((s): s is Source => Boolean(s));
}

// --- Aggregate counts (for the homepage / headers) --------------------------

export function getDatasetSummary() {
  return {
    events: events.length,
    framingClaims: framing.length,
    materials: materials.length,
    jurisdictions: jurisdictions.length,
    sources: sources.length,
  };
}
