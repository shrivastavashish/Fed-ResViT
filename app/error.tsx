'use client';
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="workspace">
      <section className="panel">
        <h1>This workspace could not load</h1>
        <p>
          No research data has been changed. Retry the view or reload the
          application.
        </p>
        <button className="primary-btn" onClick={reset}>
          Retry workspace
        </button>
      </section>
    </main>
  );
}
