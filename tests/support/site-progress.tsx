import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import type { AkarClient } from "@akar/api-client";
import { useSiteProgress } from "../../apps/web/src/components/site-tasks";

// Exercise the real hook with a stable client, as in AkarApp, and controllable network timing.
function ProgressHarness() {
  const [identity, setIdentity] = useState<string | null>("member");
  const [snapshotRevision, setSnapshotRevision] = useState(0);
  const account = useRef(identity);
  account.current = identity;
  const client = useRef({
    getSiteProgress: async () =>
      account.current
        ? (await fetch(`/progress?account=${account.current}`)).json()
        : { tasks: [], badges: [] },
  } as AkarClient);
  const { progress, refresh } = useSiteProgress(
    client,
    true,
    identity,
    snapshotRevision,
  );
  const [settled, setSettled] = useState(0);
  return (
    <>
      <button
        onClick={() => void refresh().then(() => setSettled((n) => n + 1))}
      >
        Refresh
      </button>
      <button onClick={() => setIdentity(null)}>Sign out</button>
      <button onClick={() => setIdentity("other")}>Switch account</button>
      <button onClick={() => setSnapshotRevision((n) => n + 1)}>
        Snapshot loaded
      </button>
      <output aria-label="Badges">
        {progress.badges.map((b) => b.badgeId).join(",") || "none"}
      </output>
      <output aria-label="Settled refreshes">{settled}</output>
    </>
  );
}

createRoot(document.getElementById("root")!).render(<ProgressHarness />);
