export default function Home() {
  return (
    <main>
      <section aria-labelledby="launch-board-title">
        <p>DemoHunter example app</p>
        <h1 id="launch-board-title">Next.js launch board</h1>
        <p>One route, stable selectors, and a deterministic release story for local demo generation.</p>
        <nav aria-label="Launch board sections">
          <a href="#launch-checklist">Show launch checklist</a>
          {" "}
          <a href="#qa-signoff">Reveal QA sign-off</a>
        </nav>
      </section>

      <section id="launch-checklist" aria-labelledby="launch-checklist-title">
        <h2 id="launch-checklist-title">Launch checklist</h2>
        <ul>
          <li>Marketing copy approved</li>
          <li>Docs review complete</li>
          <li>Status page ready</li>
        </ul>
      </section>

      <section id="qa-signoff" aria-labelledby="qa-signoff-title">
        <h2 id="qa-signoff-title">QA sign-off</h2>
        <p>Chromium, Firefox, and Safari spot checks passed before release day.</p>
      </section>
    </main>
  );
}
