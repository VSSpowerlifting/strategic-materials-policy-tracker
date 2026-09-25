/**
 * A stack or ledger as value-role layers. Only the layers the counting rules
 * allow to be summed show totals; every other layer lists its rows, each with
 * its own figure, and says why it is not added.
 */
import { Card } from "@/components/ui/card";
import { CommitmentRow } from "@/components/capital/rows";
import { CurrencyTotals } from "@/components/intelligence/totals";
import { summarizeCommitment } from "@/lib/capital-control";
import type { Layer } from "@/lib/capital-intelligence";
import { layerGlosses, layerLabels } from "@/lib/labels";

export function LayerBlock({ layer }: { layer: Layer }) {
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-display font-semibold">{layerLabels[layer.key]}</h3>
        <span className="font-mono text-[11px] text-faint">
          {layer.rows.length} row{layer.rows.length === 1 ? "" : "s"} · {layer.totals ? "summed per currency" : "listed, not summed"}
        </span>
      </div>
      <p className="mb-3 max-w-prose text-sm leading-6 text-muted">{layerGlosses[layer.key]}</p>
      {layer.totals ? (
        <div className="mb-3">
          <CurrencyTotals totals={layer.totals} />
        </div>
      ) : null}
      <Card className="overflow-hidden">
        {layer.rows.map((c) => (
          <CommitmentRow key={c.id} c={summarizeCommitment(c)} />
        ))}
      </Card>
    </div>
  );
}

export function LayerStack({ layers }: { layers: Layer[] }) {
  return (
    <div className="space-y-8">
      {layers.map((l) => (
        <LayerBlock key={l.key} layer={l} />
      ))}
    </div>
  );
}
