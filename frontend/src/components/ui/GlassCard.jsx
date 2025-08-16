export default function GlassCard({ title="Explosive Growth", items=[
    "10 Launch Weeks","10 Influencers Post","100,000 Views","10 Reddit Posts","2h Consultation"
  ]}) {
    return (
      <div className="uiv-card-container">
        <div className="uiv-card-border" />
        <div className="uiv-card">
          <header className="uiv-card-header">{title}</header>
          <ul className="uiv-card-list">
            {items.map((t,i)=>(<li key={i}><span>✓</span>{t}</li>))}
          </ul>
          <button className="uiv-card-cta">Book a Call</button>
        </div>
      </div>
    );
  }
  