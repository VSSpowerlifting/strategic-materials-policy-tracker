# Automatic cover assignment for SMPT research

## Scope

This policy applies to **website research publications** at `/research/<slug>` and their research-index cards. Database project records and downloadable report/PDF/deck title pages keep their own source, editorial and design standards. The cover system does not publish new research.

When publishing a new research page, include:

```tsx
import { ResearchCover } from "@/components/editorial/research-cover";

// In the article's header:
<ResearchCover data-cover={slug} data-frame="banner" data-caption="full" />

// In the research-index card:
<ResearchCover data-cover="your-publication-slug" />
```

The publication slug automatically determines the cover. The renderer returns a valid cover even when the slug has never been registered. No manual artwork selection or editorial approval is required for that assignment.

## Selection order

1. Preserve pinned covers for already published articles via `researchCovers` in `lib/photography.ts`.
2. Apply a previously registered photograph only for an identifiable depicted mine, or a genuinely generic material specimen. The China rare-earth photograph is restricted to China-specific rare-earth slugs.
3. For other supported materials, use the existing typographic plate with verified element labels.
4. For subjects without a safe specific image, use the branded SMPT research plate instead of a random photograph, a speculative mine photo, or a blank block.

Use the shared `ResearchCover` component for both index and article. Photos always show a caption with their date, place, subject, source and credit. Historical photographs never imply current operations. Additional documentary images can be enrolled only with a named subject, acquisition date, source URL, usage rights, accurate alternative text and clear limitations. Never fetch arbitrary third-party imagery at build time.

## Review separation

**No human editorial sign-off for a cover-only change.** The existing content-fingerprint gate treats `ResearchCover` markup and its `data-*` presentation props as non-content, while the photo registry lives outside the page. A change confined to these surfaces should pass without requiring a new editorial review record.

**Human research review still applies** to new publication prose, data, figures, claims, sources, captions that form substantive evidence, financial or legal statuses, and substantive metadata changes. An article newly published for the first time still requires full publication approval. Do not broaden the exemption to arbitrary image sources, `href`, `alt`, article text or social-description fields. Generic image/brand attribution in a shared cover component does not attest to the research itself.

CI tests ensure (a) all published research pages contain an automatic cover, (b) unknown slugs receive a deterministic fallback, (c) registered photographs have source, rights and limitations, and (d) the editorial fingerprint remains sensitive to financial figures and citations. A successful build and image-load check are still required before merging site changes.

## Extending the library

Prefer a known, documented image to a new search result. If the subject is not represented, ship the typographic cover immediately. Expand the photographed catalog separately after validating the image as a real, legally reusable depiction and confirming the credit and date; this is an **asset/provenance check**, not a repeat review of the research article.
