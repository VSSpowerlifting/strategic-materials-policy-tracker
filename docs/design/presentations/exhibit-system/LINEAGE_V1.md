# Research deck provenance lineage — contract v1

Status: opt-in validator, 16 November 2026. This does not replace source verification, the controlling workbook or human publication review.

Research PPTX specs supported by scripts/exhibit-system/research-deck.ts may include a top-level lineage object. Specs without lineage continue through the legacy path unchanged. Specs with lineage are rejected before rendering when any required invariant fails. The generated research manifest records normalized lineage and retains pending-human-review and not-granted publication status.

## Guarantees

1. Every analytical slide (2 onwards; cover is 1) has an ordered claim record with resolvable claim IDs and slide-local citation references.
2. Derived/modelled claims refer to named outputs of local SHA-256-pinned model files; the output record includes a locator and numerical metadata.
3. Every declared lineage figure uses a JSON Pointer into the actual exhibit.data supplied to the renderer. Its numeric value must match exactly, allowing equivalent trailing zeros. Where exhibit.data.unit is present, figure units must agree.
4. A model-linked figure must match its model output in value, unit, basis, status and as-of date. A claim on that slide must cite the same output.
5. Sum relations use exact decimal arithmetic and disallow mixed units, financial bases, statuses or as-of dates. Compare relations require matching units and bases; parallel relations explicitly represent separate bases.
6. Model files must exist inside the spec directory (symlink escape is rejected) and match their hashes. Source, model and figure dates supplied to this contract cannot exceed the research cutoff.

## Schema

- lineage.version: literal number 1.
- lineage.research_cutoff: strict ISO date YYYY-MM-DD.
- lineage.sources (optional): list of IDs registered in top-level evidence with published_at and optional as_of. Only listed sources receive date validation.
- lineage.models (optional): each has id, file (relative to spec directory), sha256, as_of, and outputs. Outputs have id, locator, value, unit, basis, status, as_of. Use ModelID/OutputID as the reference (example M1/O1).
- lineage.claims (required): id, text, evidence_class (reported, derived, modeled, judgment), evidence_refs, optional model_output_refs. Reported claims cannot point at model outputs. Derived and modeled claims require one.
- lineage.slides (required): one ordered entry per analytical slide, each with slide, claim_ids, optional figures and optional relations.
- Figures have id, data_pointer, value as a plain decimal string, unit, basis, status, as_of, evidence_refs, optional model_output_ref.
- Relations have kind (sum, compare, parallel), figure_ids, plus total_id for sum.

Figure statuses: announced, authorized, committed, drawn, disbursed, spent, commissioning, produced, delivered, invoiced, collected, modeled, not-applicable. A figure's status describes its financing/operational state; its evidence_class is recorded on the related claim.

Values must be plain decimal strings such as "125.50" or "-1.2", without currency symbols or commas. JSON Pointers use RFC 6901 paths into exhibit.data, such as /sources/0/value. An array index is zero-based. The pointer addresses the renderer input, not a cell in the editable PowerPoint.

## Illustrative lineage block

This is schematic, and not a verified research finding or a complete deck spec. Replace every invented source, model locator and amount with the controlling research materials.

~~~json
{
  "version": 1,
  "research_cutoff": "2026-11-10",
  "sources": [{"id": "S1", "published_at": "2026-11-08"}],
  "models": [{
    "id": "M1", "file": "model.json",
    "sha256": "<actual SHA-256 hash required>",
    "as_of": "2026-11-09",
    "outputs": [{
      "id": "O1", "locator": "Case!B14", "value": "12.5",
      "unit": "USD million", "basis": "drawn-debt",
      "status": "drawn", "as_of": "2026-11-09"
    }]
  }],
  "claims": [{
    "id": "C1", "text": "The specified drawn-debt balance totals USD 12.5 million",
    "evidence_class": "derived", "evidence_refs": ["S1"],
    "model_output_refs": ["M1/O1"]
  }],
  "slides": [{
    "slide": 2, "claim_ids": ["C1"],
    "figures": [{
      "id": "F1", "data_pointer": "/sources/0/value", "value": "12.5",
      "unit": "USD million", "basis": "drawn-debt",
      "status": "drawn", "as_of": "2026-11-09",
      "evidence_refs": ["S1"], "model_output_ref": "M1/O1"
    }],
    "relations": []
  }]
}
~~~

This assumes exhibit.data.sources[0].value equals 12.5 and exhibit.data.unit equals "USD million". The SHA field must be replaced by the digest of an existing model file.

## Run preflight

~~~sh
npm ci
npm run exhibits:lineage:check -- /path/to/research-spec.json
npm run exhibits:review -- /path/to/research-spec.json --strict
npm run exhibits:render -- /path/to/research-spec.json /path/to/new-draft.pptx
python3 scripts/exhibit-system/verify_editability.py --deck /path/to/new-draft.pptx --manifest /path/to/new-draft.manifest.json
~~~

The lineage preflight is read-only. It prints METADATA VALIDATED — NOT RESEARCH APPROVAL on a valid spec, and fails on missing lineage. The research renderer retains draft and human-review restrictions.

## Limitations

- Model files are hash-pinned, NOT parsed or independently recalculated. Author/reviewer must verify each declared model output and locator inside the actual workbook. A hash establishes file identity, not model accuracy.
- Declared figures are checked against numeric input fields, but the validator does not guarantee every chart datum or prose number has a lineage entry. Full source and model reconciliation is still required.
- The pointer does not verify PowerPoint geometry, chart editability or correct rendering. Run existing editability checks and visually inspect every slide.
- As-of/source dates only enforce the author-selected cutoff; they do not themselves establish source truth.
- The basis field is a controlled author-supplied label rather than a comprehensive ontology; identical strings alone cannot prove financial comparability.
- The contract is opt-in so old builds stay compatible. Rebuilding historical reports under v1 is a separately reviewed migration.

Suggested next separate engineering phase: native model-driven analytical components, followed by the visual QA pipeline.
