export default function NeonButton({ children="Hover me" }) {
    return (
      <button className="uiv-neon-btn">
        <span />
        <span />
        <span />
        <span />
        {children}
      </button>
    );
  }
  