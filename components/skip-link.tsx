"use client";

/** Focus navigation must not overwrite the URL-backed analytical selection. */
export function SkipLink() {
  return <a href="#main-content" className="skip-link" onClick={event => {
    const main = document.getElementById("main-content");
    if (!main) return;
    event.preventDefault();
    main.focus({ preventScroll: true });
    main.scrollIntoView({ behavior: "instant", block: "start" });
  }}>Skip to content</a>;
}
