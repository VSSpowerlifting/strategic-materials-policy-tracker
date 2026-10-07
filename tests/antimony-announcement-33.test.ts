import test from "node:test";
import assert from "node:assert/strict";

import {
  getControlMeasureById,
  getEventById,
  getMaterialBySlug,
  getSourceById,
} from "@/lib/data";

const exportControl = () => getControlMeasureById("ctl-cn-antimony-2024-export-licensing")!;
const superhardControl = () => getControlMeasureById("ctl-cn-antimony-2024-superhard-licensing")!;

test("Announcement No. 33 antimony scope retains coverage-defining qualifiers", () => {
  const row = exportControl();
  const scope = row.productScopeAsStated ?? "";
  for (const text of [
    "纯度（无机元素基准）大于99.999%",
    "含在惰性气体或氢气中稀释的锑的氢化物",
    "位错密度小于50个/平方厘米的单晶",
    "纯度大于99.99999%的多晶",
  ]) {
    assert.ok(scope.includes(text), `missing scope qualifier: ${text}`);
  }
  assert.match(row.notes ?? "", /having all of the following characteristics/);
  assert.match(row.notes ?? "", /does not state how the two criteria combine/);
});

test("Announcement No. 33 superhard scope retains technical coverage thresholds", () => {
  const row = superhardControl();
  const scope = row.productScopeAsStated ?? "";
  for (const text of [
    "缸径尺寸大于等于500毫米或设计使用压力大于等于5千兆帕",
    "合成压力大于5千兆帕的高压控制系统",
    "微波功率在10千瓦以上，且微波频率为915兆赫或2450兆赫",
    "直径3英寸及以上的单晶或多晶",
    "可见光透过率65%及以上",
  ]) {
    assert.ok(scope.includes(text), `missing scope threshold: ${text}`);
  }
});

test("antimony material summary agrees with the separately coded September 2024 event", () => {
  const material = getMaterialBySlug("antimony")!;
  assert.ok(material.eventIds.includes("evt-cn-antimony-2024"));
  assert.ok(getEventById("evt-cn-antimony-2024"));
  assert.match(material.statusSummary, /separately coded as Announcement No\. 33 \(2024\)/);
  assert.doesNotMatch(material.statusSummary, /not separately coded as an event/);
});

test("Announcement No. 33 remains tied to the registered official primary", () => {
  const source = getSourceById("src-mofcom-33")!;
  assert.equal(source.publisher, "Ministry of Commerce (China)");
  assert.equal(source.datePublished, "2024-08-15");
  assert.equal(source.confidence, "primary");
  assert.equal(source.sourceType, "official");
  assert.equal(exportControl().statusHistory.at(-1)?.date, "2024-09-15");
  assert.equal(superhardControl().statusHistory.at(-1)?.date, "2024-09-15");
});
