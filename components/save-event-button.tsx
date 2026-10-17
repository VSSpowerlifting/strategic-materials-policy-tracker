"use client";

import { useEffect, useState } from "react";
import { readSavedEvents, subscribeSavedEvents, tryToggleSavedEvent } from "@/lib/watchlist-client";

/**
 * Toggle for a reader's own local list at `/saved`. Initial render always
 * shows the unsaved state (matching the server-rendered HTML, which cannot
 * know a browser's localStorage) and corrects itself in an effect after
 * mount — the standard pattern for client-only state that must not cause a
 * hydration mismatch.
 */
export function SaveEventButton({ eventId }: { eventId: string }) {
  const [saved, setSaved] = useState(false);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    // Correcting client-only state (localStorage) after mount, not deriving
    // it during render — same sanctioned exception the events/search
    // explorers use for reading window.location after mount.
    /* eslint-disable react-hooks/set-state-in-effect */
    const refresh = () => {
      const result = readSavedEvents();
      if (result.ok) setSaved(result.ids.includes(eventId));
      setStorageError(!result.ok);
    };
    refresh();
    return subscribeSavedEvents(refresh);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [eventId]);

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          const result = tryToggleSavedEvent(eventId);
          if (result.ok) setSaved(result.ids.includes(eventId));
          setStorageError(!result.ok);
        }}
        aria-pressed={saved}
        className={`inline-flex min-h-11 items-center gap-1.5 rounded-md border px-3 py-1.5 font-display text-sm transition-colors ${
          saved
            ? "border-accent/50 text-accent hover:border-accent hover:text-accent-strong"
            : "border-border text-foreground hover:border-accent/50 hover:text-accent"
        }`}
      >
        <span aria-hidden="true">{saved ? "★" : "☆"}</span>
        {saved ? "Saved to my list" : "Save to my list"}
      </button>
      {storageError ? <p role="status" className="mt-2 max-w-prose text-sm leading-6 text-muted">
        Your saved list could not be read or updated. Check your browser&apos;s site storage settings and try again.
      </p> : null}
    </div>
  );
}
