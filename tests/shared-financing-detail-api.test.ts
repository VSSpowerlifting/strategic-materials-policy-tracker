import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { GET } from "@/app/api/v1/projects/[id]/route";
import { projectStack } from "@/lib/capital-intelligence";

test("project API exposes associated financing separately, without changing stack layers", async () => {
  const id = "prj-lynas-hre-separation";
  const response = await GET(new Request("http://localhost"), { params: Promise.resolve({ id }) });
  assert.equal(response.status, 200);
  const body = await response.json();
  const stack = projectStack(id)!;
  assert.deepEqual(body.associatedRowIds, stack.associatedRows.map((c) => c.id));
  assert.ok(body.associatedRowIds.includes("fin-jp-jare-lynas-2023-equity"));
  assert.ok(body.layers.every((layer: { rowIds: string[] }) => !layer.rowIds.includes("fin-jp-jare-lynas-2023-equity")));
});

test("capital detail links shared projects with explicit unallocated explanation", () => {
  const source = readFileSync(resolve(process.cwd(), "app/capital/[id]/page.tsx"), "utf8");
  assert.match(source, /c\.associatedProjectIds\.map/);
  assert.match(source, /do not allocate the amount/);
});
