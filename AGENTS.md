<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Mandatory publication writing guide

For every new or substantially revised public-facing research article, policy analysis, report, executive memo, social research edition or publication landing page, **read [SMPT Research Publication House Style](docs/research/SMPT_RESEARCH_PUBLICATION_HOUSE_STYLE.md) before drafting and revisit its natural-language review checklist before delivery**. This requirement applies to narrative articles and website copy, not just decks. It complements the legal/source and publication gates below; a fluent rewrite must never erase a material qualifier, source or legal-status distinction. Automated adherence checks can verify the guide is routed and files compile, but human editorial judgment is still required to approve the writing.

## Automatic research covers (presentation-only)

Every new `app/research/<slug>/page.tsx` publication must include `<ResearchCover data-cover={slug} />` in its hero, and the research-index card must use the same component. The cover resolver in `lib/photography.ts` automatically chooses a provenance-registered documentary image when the subject is a precise match, and otherwise renders a branded material or general-research plate. A new publication needs no manually selected cover. Do not use image searches, synthetic documentary imagery, or geographically misleading photographs as automatic fallbacks.

Cover assignment, cropping and image-registry updates are **exempt from human editorial approval** when they are purely presentation changes; automated provenance, copyright, accessibility, build and visual checks still apply. Adding or changing research prose, figures, legal classifications, citations, substantive metadata, or a new publication remains under the existing human review and release gates. Do not exempt an entire page or broad metadata fields just to bypass approval. See `docs/research/AUTOMATIC_COVER_POLICY.md`.

## Website editorial and interface standard

Use concise, specific, natural editorial copy. A visible sentence must provide a fact, clarify a material distinction, or help the reader navigate. Remove duplicate introductions, ornamental microcopy, question-shaped labels, generic slogans, and repeated platform self-explanations. Prefer publication titles, authors, dates, record fields and source links to promotional prose. Keep navigation labels short and place technical explanations in methodology, contextual disclosures, or accessible detail views.

Do not remove source attribution, legal/financial status distinctions, uncertainty, methodological qualifications or accessibility information to achieve shorter copy. Check the resulting page at mobile and desktop widths; compare before/after reading time, navigation clarity and content availability. This standard applies to all new public pages and future revisions.

## SMPT editorial positioning

Treat SMPT as a comparative economic-security and industrial-policy research platform, not as a China- or Mandarin-centered project. Apply these principles to all public-facing copy, metadata and project documentation:

- **Geographically neutral:** Organize comparisons by policy instrument, material, jurisdiction and evidence. Do not cast China as the default subject and other jurisdictions as reactions; retain country-specific facts where supported. Coverage is selective and uneven, not equivalent across countries.
- **Economically substantive:** Explain trade and legal controls, industrial policy, public financing, investment, stockpiling and implementation with precise status distinctions. Do not confuse announcements, commitments, disbursements and physical operations.
- **Evidence-driven:** Connect policy measures, official rationales, financing, projects and reported industrial observations to attributable primary sources. Preserve unknowns and distinguish government claims, issuer reports and independent verification; shared dates or materials do not prove causality.

For **Applied Strategy** and **Financial Intelligence** research products, read [the permanent Four-Layer Analytical Framework & Applied Strategy Standard](docs/research/SMPT_APPLIED_STRATEGY_STANDARD.md) before drafting a deck, model or recommendation. Treat these as separate analytical products: test policy → capital allocation → execution → commercial implications; label evidence versus assumptions and scenarios; preserve original-source traceability and keep projections out of the source-linked tracker.

For every new or revised SMPT research deck, also read [Presentation Standard v2](docs/design/presentations/SMPT_PRESENTATION_STANDARD_V2.md), [Exhibit and Chart Rules](docs/design/presentations/EXHIBIT_AND_CHART_RULES.md), and the mandatory [Editorial Authenticity & Visual Integrity Standard](docs/design/presentations/EDITORIAL_AUTHENTICITY_AND_VISUAL_INTEGRITY.md). Record the five review gates in the publication QC handoff. Prefer affirmative, specific analytical prose; preserve material factual negations and evidence distinctions. Do not infer human approval from automated review.

Also apply the [Visual Repertoire & Consulting References](docs/design/presentations/VISUAL_REPERTOIRE_AND_REFERENCES.md): plan exhibit families in the existing slide manifest, actively consider graphics for timing/change/state questions, and review the contact sheet for purposeful visual variety. Use the [Publication Design System](docs/design/PUBLICATION_DESIGN_SYSTEM.md) for the live site's type roles, cover imagery and export checks; retain tables where precise comparison warrants them. External examples are linked and discussed, while SMPT graphics remain original and editable.

Preserve the existing schema, source rights, reviewer authority and publication gates when changing language. Do not rewrite historically or country-specific sourced records merely to make aggregate messaging geographically neutral.
