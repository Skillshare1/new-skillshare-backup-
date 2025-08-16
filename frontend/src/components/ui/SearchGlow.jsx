export default function SearchGlow() {
    return (
      <div className="uiv-grid relative mx-auto my-6">
        <div className="uiv-glow" />
        <div className="uiv-border" />
        <div className="uiv-white" />
        <input className="uiv-input" placeholder="Search…" />
        <button className="uiv-icon" aria-label="Go" />
      </div>
    );
  }
  