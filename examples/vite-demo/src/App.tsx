export function App() {
  return (
    <main>
      <section aria-labelledby="vite-demo-title">
        <p>DemoHunter example app</p>
        <h1 id="vite-demo-title">Vite demo console</h1>
        <p>Minimal React state changes make the example stable for repeatable narrated output.</p>
        <nav aria-label="Demo console sections">
          <a href="#deployment-checklist">Open deployment checklist</a>
          {" "}
          <a href="#playback-notes">Show playback notes</a>
        </nav>
      </section>

      <section id="deployment-checklist" aria-labelledby="deployment-checklist-title">
        <h2 id="deployment-checklist-title">Deployment checklist</h2>
        <ul>
          <li>Preview link verified</li>
          <li>Release notes drafted</li>
          <li>Support handoff shared</li>
        </ul>
      </section>

      <section id="playback-notes" aria-labelledby="playback-notes-title">
        <h2 id="playback-notes-title">Playback notes</h2>
        <p>Portable artifacts land in .demohunter and can be replayed without the source repo later.</p>
      </section>
    </main>
  );
}
