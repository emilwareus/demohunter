"use client";

import { useState } from "react";

export default function Home() {
  const [showChecklist, setShowChecklist] = useState(false);
  const [showSignoff, setShowSignoff] = useState(false);

  return (
    <main>
      <section aria-labelledby="launch-board-title">
        <p>DemoHunter example app</p>
        <h1 id="launch-board-title">Next.js launch board</h1>
        <p>One route, stable selectors, and a deterministic release story for local demo generation.</p>
        <div>
          <button type="button" onClick={() => setShowChecklist(true)}>
            Show launch checklist
          </button>
          <button type="button" onClick={() => setShowSignoff(true)}>
            Reveal QA sign-off
          </button>
        </div>
      </section>

      {showChecklist ? (
        <section aria-labelledby="launch-checklist-title">
          <h2 id="launch-checklist-title">Launch checklist</h2>
          <ul>
            <li>Marketing copy approved</li>
            <li>Docs review complete</li>
            <li>Status page ready</li>
          </ul>
        </section>
      ) : null}

      {showSignoff ? (
        <section aria-labelledby="qa-signoff-title">
          <h2 id="qa-signoff-title">QA sign-off</h2>
          <p>Chromium, Firefox, and Safari spot checks passed before release day.</p>
        </section>
      ) : null}
    </main>
  );
}
