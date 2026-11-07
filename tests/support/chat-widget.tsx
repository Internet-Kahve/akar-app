import { useState } from "react";
import { createRoot } from "react-dom/client";
import { createHttpClient, createSeed } from "@akar/api-client";
import { ChatWidget } from "../../apps/web/src/components/chat-widget";
import { SiteDetail } from "../../apps/web/src/components/site-detail";
import { LangProvider } from "../../apps/web/src/components/i18n";

const client = createHttpClient({ baseUrl: location.origin + "/chat-api" });
const sites = createSeed().sites;
const noop = () => {};

function ChatHarness() {
  const params = new URLSearchParams(location.search);
  const [siteId, setSiteId] = useState(params.get("site"));
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const signedIn = !params.has("guest");
  const site = sites.find((s) => s.id === siteId);
  const lang = params.has("en") ? "en" : "tr";
  const onOpen = () =>
    signedIn ? setOpen(true) : setReason("Asistanı kullanmak için giriş yap.");
  return (
    <LangProvider lang={lang}>
      <div className="app-shell">
        <main className="workspace on-site">
          <div
            className="side-panel full"
            style={{ height: "75dvh", overflowY: "auto" }}
          >
            {site ? (
              <div className="detail-panel">
                <SiteDetail
                  site={site}
                  saved={false}
                  read={false}
                  progress={{ tasks: [], badges: [] }}
                  memoryCount={0}
                  onBack={() => setSiteId(null)}
                  onSave={noop}
                  onStory={noop}
                  onAbout={noop}
                  onHistory={noop}
                  onMemories={noop}
                  onPuzzle={noop}
                  onChat={onOpen}
                />
              </div>
            ) : (
              <h1>Eserler</h1>
            )}
          </div>
          <div className="main-stage" />
        </main>
        {reason && <p role="alert">{reason}</p>}
        <ChatWidget
          key={siteId ?? "catalog"}
          signedIn={signedIn}
          open={open}
          onOpen={onOpen}
          onClose={() => setOpen(false)}
          site={site}
          ask={client.chat}
          onSignIn={setReason}
          onSite={(id) => {
            setSiteId(id);
            location.hash = new URLSearchParams({
              view: "detail",
              site: id,
            }).toString();
          }}
        />
      </div>
    </LangProvider>
  );
}

createRoot(document.getElementById("root")!).render(<ChatHarness />);
