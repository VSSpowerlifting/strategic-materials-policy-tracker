import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const file=(path:string)=>readFile(path,"utf8");
const rgb=(hex:string):[number,number,number]=>
 [...hex.matchAll(/[0-9a-fA-F]{2}/g)].map(x=>parseInt(x[0],16)/255) as [number,number,number];
const luminance=(hex:string)=>{
 const [r,g,b]=rgb(hex).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);
 return .2126*r+.7152*g+.0722*b;
};
const ratio=(a:string,b:string)=>{
 const l1=luminance(a),l2=luminance(b);
 return (Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);
};

test("existing SMPT ink colors retain readable WCAG contrast against dark record surfaces",async()=>{
 const css=await file("app/globals.css");
 const get=(name:string)=>new RegExp("--"+name+":\\s*(#[0-9a-fA-F]{6})\\s*;").exec(css)?.[1];
 const fg=get("fg")!,muted=get("muted")!,faint=get("faint")!;
 for(const surface of ["bg","surface","elevated","plate"]){
  const bg=get(surface)!;
  assert.ok(ratio(fg,bg)>=7,"foreground on "+surface);
  assert.ok(ratio(muted,bg)>=4.5,"muted text on "+surface);
  assert.ok(ratio(faint,bg)>=4.5,"metadata contrast on "+surface+" ratio="+ratio(faint,bg).toFixed(2));
 }
});

test("shared detail sections use typographic headings and legible explanatory copy, not 11px mono headings",async()=>{
 const component=await file("components/ui/container.tsx");
 assert.match(component,/h2 className="font-display text-xl font-semibold/);
 assert.match(component,/max-w-3xl text-\[0\.9375rem\] leading-7 text-muted/);
 assert.ok(!component.includes('h2 className="font-mono text-[11px]'));
 assert.match(component,/scroll-mt-24/);
});

test("fact sheet labels and badges have differentiated readable sizes",async()=>{
 const primitive=await file("components/capital/primitives.tsx");
 const badge=await file("components/ui/badge.tsx");
 assert.match(primitive,/font-display text-xs font-semibold leading-5 text-muted/);
 assert.match(primitive,/text-\[0\.9375rem\] leading-7 \[overflow-wrap:anywhere\]/);
 assert.match(badge,/font-mono text-xs leading-5/);
});

test("evidence preserves exact source fields on both responsive layouts",async()=>{
 const primitive=await file("components/capital/primitives.tsx");
 const evidence=primitive.slice(primitive.indexOf("export function EvidenceTable"),primitive.indexOf("/** A labelled fact row"));
 assert.match(evidence,/aria-label="Evidence references"/);
 assert.match(evidence,/sm:hidden/);
 assert.match(evidence,/hidden overflow-x-auto rounded-lg border border-border-strong sm:block/);
 assert.match(evidence,/<caption className="sr-only">/);
 assert.match(evidence,/View source dossier/);
 assert.match(evidence,/Source dossier/);
 assert.match(evidence,/e\.supports\.map/);
 assert.match(evidence,/evidenceLevelLabels\[e\.evidence\]/);
 assert.match(evidence,/e\.locator/);
 assert.match(evidence,/e\.note/);
 assert.match(evidence,/s\.url/);
});

test("source cards keep exact primary document href and dossier href while promoting a clear reading action",async()=>{
 const source=await file("components/source-ref.tsx");
 assert.match(source,/href=\{source\.url\}/);
 assert.match(source,/Open original document/);
 assert.match(source,/source\.url/);
 assert.match(source,/href=\{\`\/sources\/\$\{source\.id\}\`\}/);
 assert.match(source,/View citing records/);
 assert.match(source,/max-w-prose text-\[0\.9375rem\] leading-7/);
});

test("search and categorical filters are touch friendly and don't trigger iOS text-input zoom",async()=>{
 const filter=await file("components/capital/filter-controls.tsx");
 assert.match(filter,/min-h-11 w-full/);
 assert.match(filter,/font-display text-base/);
 assert.match(filter,/sm:text-sm/);
 assert.match(filter,/focus-visible:ring-2/);
 assert.match(filter,/mb-1\.5 block font-display text-xs font-medium/);
 assert.match(filter,/useUrlFilters/);
});

test("global keyboard focus preserves dark-and-gold palette, reduced motion, and text wrapping",async()=>{
 const css=await file("app/globals.css");
 assert.match(css,/:where\(a, button, input, select, textarea, summary\):focus-visible/);
 assert.match(css,/outline: 2px solid var\(--accent\)/);
 assert.match(css,/h1, h2, h3, p, dd/);
 assert.match(css,/@media \(prefers-reduced-motion: reduce\)/);
 assert.match(css,/--accent: #e3b04b/);
});
