import type { ReactNode } from "react";

const styles = `
  :root {
    color-scheme: light dark;
  }
  * {
    box-sizing: border-box;
  }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    background: radial-gradient(circle at top, #1f2937 0%, #0b1120 60%);
    color: #f8fafc;
    min-height: 100vh;
  }
  .stage {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 2rem;
  }
  .card {
    width: min(520px, 100%);
    padding: 3rem 2.5rem;
    border-radius: 24px;
    background: rgba(15, 23, 42, 0.72);
    border: 1px solid rgba(148, 163, 184, 0.2);
    box-shadow: 0 24px 60px rgba(15, 23, 42, 0.45);
    text-align: center;
    backdrop-filter: blur(16px);
  }
  .eyebrow {
    margin: 0 0 0.75rem;
    font-size: 0.8rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #94a3b8;
  }
  h1 {
    margin: 0 0 0.75rem;
    font-size: clamp(2rem, 5vw, 2.75rem);
    letter-spacing: -0.02em;
  }
  .lead {
    margin: 0 0 2rem;
    color: #cbd5f5;
    font-size: 1.05rem;
  }
  .cta {
    font: inherit;
    font-weight: 600;
    padding: 0.85rem 1.75rem;
    border-radius: 999px;
    border: none;
    cursor: pointer;
    background: linear-gradient(135deg, #38bdf8, #6366f1);
    color: white;
    box-shadow: 0 12px 30px rgba(99, 102, 241, 0.35);
    transition: transform 120ms ease, box-shadow 120ms ease;
  }
  .cta:hover {
    transform: translateY(-1px);
    box-shadow: 0 16px 34px rgba(99, 102, 241, 0.45);
  }
  .cta:focus-visible {
    outline: 2px solid #f8fafc;
    outline-offset: 3px;
  }
  .finale {
    margin: 2rem 0 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #bbf7d0;
  }
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: styles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
