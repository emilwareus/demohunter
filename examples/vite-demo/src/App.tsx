import { useState } from "react";

export function App() {
  const [finished, setFinished] = useState(false);

  return (
    <main className="stage">
      <section className="card" aria-labelledby="hello-title">
        <p className="eyebrow">DemoHunter example</p>
        <h1 id="hello-title">Hello DemoHunter!</h1>
        <p className="lead">A tiny page, one button, one narrated finale.</p>

        <button
          type="button"
          className="cta"
          onClick={() => setFinished(true)}
          aria-pressed={finished}
        >
          Show the finale
        </button>

        {finished ? (
          <p className="finale" role="status">Hope you enjoyed the video!</p>
        ) : null}
      </section>
    </main>
  );
}
