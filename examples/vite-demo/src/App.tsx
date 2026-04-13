import { useState } from "react";

export function App() {
  const [showChecklist, setShowChecklist] = useState(false);
  const [showPlayback, setShowPlayback] = useState(false);

  return (
    <main>
      <section aria-labelledby="vite-demo-title">
        <p>DemoHunter example app</p>
        <h1 id="vite-demo-title">Vite demo console</h1>
        <p>Minimal React state changes make the example stable for repeatable narrated output.</p>
        <div>
          <button type="button" onClick={() => setShowChecklist(true)}>
            Open deployment checklist
          </button>
          <button type="button" onClick={() => setShowPlayback(true)}>
            Show playback notes
          </button>
        </div>
      </section>

      {showChecklist ? (
        <section aria-labelledby="deployment-checklist-title">
          <h2 id="deployment-checklist-title">Deployment checklist</h2>
          <ul>
            <li>Preview link verified</li>
            <li>Release notes drafted</li>
            <li>Support handoff shared</li>
          </ul>
        </section>
      ) : null}

      {showPlayback ? (
        <section aria-labelledby="playback-notes-title">
          <h2 id="playback-notes-title">Playback notes</h2>
          <p>Portable artifacts land in .demohunter and can be replayed without the source repo later.</p>
        </section>
      ) : null}
    </main>
  );
}
