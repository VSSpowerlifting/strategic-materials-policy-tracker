"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { LatticeMark } from "@/components/ui/brand";
import { FlowTexture } from "@/components/ui/texture";
import { getMaterialMeta } from "@/lib/materials-meta";
import { site } from "@/lib/site";

const SESSION_KEY = "smpt:title-seen";
const OPENING_MATERIALS = [
  { id: "tungsten", name: "Tungsten", x: 24, y: 12 },
  { id: "neodymium", name: "Neodymium", x: 72, y: 8 },
  { id: "gallium", name: "Gallium", x: 88, y: 46 },
  { id: "antimony", name: "Antimony", x: 68, y: 84 },
  { id: "dysprosium", name: "Dysprosium", x: 20, y: 76 },
] as const;

/** The native dialog keeps the overview inert and handles Escape and focus restoration. */
export function playTitlePage(dialog: HTMLDialogElement) {
  if (
    window.location.pathname !== "/" || window.location.hash || window.location.search ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) return;

  try {
    if (window.sessionStorage.getItem(SESSION_KEY)) return;
  } catch {
    // Storage can be unavailable; the opening still works for this visit.
  }

  const root = document.documentElement;
  const previousOverflow = root.style.overflow;
  delete dialog.dataset.leaving;
  dialog.showModal();
  root.style.overflow = "hidden";

  const leaveTimer = window.setTimeout(() => { dialog.dataset.leaving = "true"; }, 3600);
  const closeTimer = window.setTimeout(() => dialog.close(), 4200);
  const restore = () => {
    window.clearTimeout(leaveTimer);
    window.clearTimeout(closeTimer);
    root.style.overflow = previousOverflow;
  };
  const onClose = () => {
    // Ignore a queued close event if React's development remount has reopened the dialog.
    if (dialog.open) return;
    restore();
    try { window.sessionStorage.setItem(SESSION_KEY, "true"); } catch { /* Optional storage. */ }
  };
  dialog.addEventListener("close", onClose);

  return () => {
    dialog.removeEventListener("close", onClose);
    dialog.close();
    restore();
  };
}

export function TitlePage() {
  const dialog = useRef<HTMLDialogElement>(null);
  const words = site.name.split(" ");

  useEffect(() => {
    if (dialog.current) return playTitlePage(dialog.current);
  }, []);

  return (
    <dialog
      ref={dialog}
      className="title-page"
      aria-labelledby="opening-title"
      aria-describedby="opening-description"
    >
      <div className="title-page__frame">
        <FlowTexture className="title-page__flows" />
        <div className="title-page__masthead">
          <span>{site.shortName}</span>
          <span>Policy, capital &amp; control</span>
        </div>

        <div className="title-page__body">
          <div className="title-page__art" aria-hidden="true">
            <div className="title-page__outline" />
            <LatticeMark className="title-page__mark" priority />
            <div className="title-page__scan" />
            <svg className="title-page__connections" viewBox="0 0 600 600" fill="none">
              <path d="M144 72 432 48 528 276 408 504 120 456 144 72" />
              <path d="M144 72 300 300 432 48M528 276 300 300 408 504M120 456 300 300" />
              <circle cx="300" cy="300" r="8" />
            </svg>
            {OPENING_MATERIALS.map((material, index) => {
              const meta = getMaterialMeta(material.id);
              return (
                <div
                  key={material.id}
                  className="title-page__element"
                  style={{ "--x": `${material.x}%`, "--y": `${material.y}%`, "--order": index } as CSSProperties}
                >
                  <span className="title-page__atomic-number">{meta.atomicNumber}</span>
                  <span className="title-page__symbol">{meta.symbol}</span>
                  <span className="title-page__element-name">{material.name}</span>
                </div>
              );
            })}
          </div>
          <div className="title-page__copy">
            <h2 id="opening-title" className="title-page__title" aria-label={site.name}>
              <span>{words[0]}</span>
              <span>{words[1]}</span>
              <span>{words.slice(2).join(" ")}</span>
            </h2>
            <p id="opening-description" className="title-page__description">{site.tagline}</p>
            <div className="title-page__stages" aria-hidden="true">
              <span>Mining</span><i /><span>Separation</span><i /><span>Refining</span><i /><span>Components</span>
            </div>
          </div>
        </div>

        <div className="title-page__footer">
          <p>A source-linked record</p>
          <button type="button" onClick={() => dialog.current?.close()}>
            Enter the tracker
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" /></svg>
          </button>
        </div>
      </div>
    </dialog>
  );
}
