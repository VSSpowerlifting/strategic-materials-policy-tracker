"use client";

import { useEffect, useState } from "react";
import { isEventSaved, subscribeSavedEvents, toggleSavedEvent } from "@/lib/watchlist-client";

/**
 * Toggle for a reader's own local list at `/saved`. Initial render always
 * shows the unsaved state (matching the server-rendered HTML, which cannot
 * know a browser's localStorage) and corrects itself in an effect after
 * mount — the standard pattern for client-only state that must not cause a
 * hydration mismatch.
 */
export function SaveEventButton({ eventId }: { eventId: string }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Correcting client-only state (localStorage) after mount, not deriving
    // it during render — same sanctioned exception the events/search
    // explorers use for reading window.location after mount.
    /* eslint-disable react-hooks/set-state-in-effect */
    setSaved(isEventSaved(eventId));
    return subscribeSavedEvents(() => setSaved(isEventSaved(eventId)));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [eventId]);

  return (
    <button
      type="button"
      onClick={() => setSaved(toggleSavedEvent(eventId))}
      aria-pressed={saved}
      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 font-display text-xs transition-colors ${
        saved
          ? "border-accent/50 text-accent hover:border-accent hover:text-accent-strong"
          : "border-border text-foreground hover:border-accent/50 hover:text-accent"
      }`}
    >
      <span aria-hidden="true">{saved ? "★" : "☆"}</span>
      {saved ? "Saved to my list" : "Save to my list"}
    </button>
  );
}
