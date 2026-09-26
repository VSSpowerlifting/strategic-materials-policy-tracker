import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Dossier } from "@/components/dossier/dossier";
import { getAllMaterials } from "@/lib/data";
import { buildMaterialDossier } from "@/lib/material-dossier";
import { site } from "@/lib/site";

export function generateStaticParams() {
  return getAllMaterials().map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const payload = buildMaterialDossier(slug, site.lastUpdated);
  if (!payload) return { title: "Material not found" };
  return { title: payload.nameEn, description: payload.metaDescription };
}

export default async function MaterialPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const payload = buildMaterialDossier(slug, site.lastUpdated);
  if (!payload) notFound();
  return <Dossier payload={payload} />;
}
