"use client";
import { useEffect, useState } from "react";
import { subscribeAnnouncements, type Announcement } from "../lib/announce";

/**
 * The app's only two live regions (polite and assertive). They are in the page from the first paint and stay there:
 * a region added together with its text is often not read. A new message first empties the region, then fills it on
 * the next frame, so a reader hears it even when the text is the same as an earlier one.
 */
export function LiveRegion() {
  const [polite, setPolite] = useState("");
  const [assertive, setAssertive] = useState("");
  useEffect(() => {
    let frame = 0;
    const unsubscribe = subscribeAnnouncements(({ message, politeness }: Announcement) => {
      const set = politeness === "assertive" ? setAssertive : setPolite;
      set("");
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => set(message));
    });
    return () => {
      cancelAnimationFrame(frame);
      unsubscribe();
    };
  }, []);
  return (
    <>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true" data-live="polite">
        {polite}
      </div>
      <div className="sr-only" role="alert" aria-live="assertive" aria-atomic="true" data-live="assertive">
        {assertive}
      </div>
    </>
  );
}
