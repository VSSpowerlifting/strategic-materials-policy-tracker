"use client";

/**
 * Shared state for the capital-flow status replay: which dated step the exhibit shows, whether the reader has
 * used the controls, and whether a replay is running. The steps come from lib/capital-flow-timeline; nothing
 * here classifies, dates or words a status itself.
 *
 * Until the reader uses the controls the exhibit shows the latest reading, exactly as it renders without
 * JavaScript.
 */
import { createContext, useContext, useEffect, useState } from "react";
import type { CapitalFlowStep, CapitalFlowTimeline } from "@/lib/capital-flow-timeline";

/** Time each step holds during a replay: long enough to read the line that changed. */
export const REPLAY_STEP_MS = 1800;

export type ReplayState = {
  steps: readonly CapitalFlowStep[];
  index: number;
  /** True once the reader has used the controls. Before that the exhibit is the latest, unannotated reading. */
  interacted: boolean;
  playing: boolean;
  select: (index: number) => void;
  togglePlay: () => void;
  /** Row headlines, by row id, for the change notes. */
  headlines: Readonly<Record<string, string>>;
  timeline: CapitalFlowTimeline;
};

const ReplayContext = createContext<ReplayState | null>(null);

export function CapitalFlowReplay({
  timeline,
  headlines,
  children,
}: {
  timeline: CapitalFlowTimeline;
  headlines: Readonly<Record<string, string>>;
  children: React.ReactNode;
}) {
  const steps = timeline.steps;
  const last = steps.length - 1;
  const [index, setIndex] = useState(last);
  const [interacted, setInteracted] = useState(false);
  const [playing, setPlaying] = useState(false);

  // A replay holds each step, advances once, and stops at the latest reading.
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      const next = Math.min(index + 1, last);
      setIndex(next);
      if (next >= last) setPlaying(false);
    }, REPLAY_STEP_MS);
    return () => window.clearTimeout(timer);
  }, [playing, index, last]);

  const value: ReplayState = {
    steps,
    index,
    interacted,
    playing,
    headlines,
    timeline,
    select: (i) => {
      setPlaying(false);
      setInteracted(true);
      setIndex(Math.max(0, Math.min(last, i)));
    },
    togglePlay: () => {
      if (playing) {
        setPlaying(false);
        return;
      }
      setInteracted(true);
      if (index >= last) setIndex(0);
      setPlaying(true);
    },
  };

  return <ReplayContext.Provider value={value}>{children}</ReplayContext.Provider>;
}

export function useReplay(): ReplayState | null {
  return useContext(ReplayContext);
}

/** The step the exhibit is showing, and whether to mark what changed at it. Null outside a replay. */
export function useCapitalFlowStep(): {
  step: CapitalFlowStep;
  index: number;
  /** Mark changed lines only after the reader has stepped; the default view is never annotated. */
  markChanges: boolean;
} | null {
  const ctx = useContext(ReplayContext);
  if (!ctx || ctx.steps.length < 2) return null;
  return { step: ctx.steps[ctx.index], index: ctx.index, markChanges: ctx.interacted };
}

/** The reading date in the caption: "as of" for the latest reading, "as recorded by" for an earlier step. */
export function ReplayAsOf({ latestLabel }: { latestLabel: string }) {
  const ctx = useContext(ReplayContext);
  const step = ctx ? ctx.steps[ctx.index] : null;
  if (!step || step.latest) return <>Status of each line as of {latestLabel}.</>;
  return <>Status of each line as recorded by {step.asOfLabel}.</>;
}

/** The status wording of a row listed apart, at the step shown. */
export function ListedStatus({ id, latestText }: { id: string; latestText: string }) {
  const ctx = useContext(ReplayContext);
  const step = ctx ? ctx.steps[ctx.index] : null;
  const state = step && !step.latest ? step.listed[id] : undefined;
  return <>{state ? state.status.text : latestText}</>;
}
