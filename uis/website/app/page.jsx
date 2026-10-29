const services = [
  ['01', 'Warehouse operations', 'Inventory storage, picking, and packing from our Los Angeles and Zaragoza facilities.'],
  ['02', 'Last-mile delivery', 'Carrier coordination and shipment handling across an eight-carrier network in two countries.'],
  ['03', 'Reverse logistics', 'Structured returns, inspection, reconditioning, and clear next-step decisions.'],
];

function Brand({ footer = false }) {
  return (
    <a className={`brand${footer ? ' brand-footer' : ''}`} href="/uis/website/" aria-label="TrackFlow home">
      <span className="brand-mark" aria-hidden="true">TF</span>
      <span>TrackFlow</span>
    </a>
  );
}

function ServiceCard({ number, heading, text }) {
  return (
    <article className="service-card">
      <span className="service-number" aria-hidden="true">{number}</span>
      <h3>{heading}</h3>
      <p>{text}</p>
    </article>
  );
}

export default function HomePage() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="site-header">
        <div className="shell header-inner">
          <Brand />
          <nav aria-label="Primary navigation">
            <a href="#capabilities">Capabilities</a>
            <a href="#footprint">Footprint</a>
            <a className="nav-cta" href="#contact">Contact</a>
          </nav>
        </div>
      </header>

      <main id="main-content">
        <section className="hero" aria-labelledby="hero-title">
          <div className="shell hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">Warehousing · Last mile · Returns</p>
              <h1 id="hero-title">Logistics that keeps commerce moving.</h1>
              <p className="hero-lead">
                TrackFlow stores, packs, ships, and receives products for e-commerce brands across the United States and Spain.
              </p>
              <div className="hero-actions">
                <a className="button button-primary" href="#contact">Plan your operation</a>
                <a className="text-link" href="#capabilities">Explore capabilities <span aria-hidden="true">→</span></a>
              </div>
            </div>
            <aside className="route-card" aria-label="TrackFlow operating network">
              <div className="route-card-top">
                <span>Live network</span>
                <span className="status"><span className="status-dot"></span>Operating</span>
              </div>
              <div className="route">
                <div><strong>LAX</strong><span>Los Angeles</span></div>
                <div className="route-line" aria-hidden="true"><span></span></div>
                <div><strong>ZAZ</strong><span>Zaragoza</span></div>
              </div>
              <dl className="route-stats">
                <div><dt>Warehouses</dt><dd>2</dd></div>
                <div><dt>Carrier network</dt><dd>8</dd></div>
                <div><dt>Markets</dt><dd>2</dd></div>
              </dl>
            </aside>
          </div>
        </section>

        <section className="capabilities section" id="capabilities" aria-labelledby="capabilities-title">
          <div className="shell">
            <div className="section-heading">
              <div>
                <p className="eyebrow">One accountable partner</p>
                <h2 id="capabilities-title">From shelf to doorstep—and back.</h2>
              </div>
              <p>We connect the physical steps behind every order so your team can focus on products and customers.</p>
            </div>
            <div className="card-grid">
              {services.map(([number, heading, text]) => <ServiceCard key={number} number={number} heading={heading} text={text} />)}
            </div>
          </div>
        </section>

        <section className="footprint section" id="footprint" aria-labelledby="footprint-title">
          <div className="shell footprint-grid">
            <div>
              <p className="eyebrow eyebrow-light">Built for cross-border operations</p>
              <h2 id="footprint-title">Local execution.<br />Shared direction.</h2>
              <p>Our teams in California and Aragón coordinate inventory, shipments, carrier incidents, and returns for growing brands.</p>
            </div>
            <dl className="metrics">
              <div><dt>People</dt><dd>~130</dd><span>across operations and technology</span></div>
              <div><dt>Founded</dt><dd>2009</dd><span>in Los Angeles</span></div>
              <div><dt>Annual revenue</dt><dd>€9M</dd><span>approximately</span></div>
              <div><dt>Returns handled</dt><dd>18–25%</dd><span>of volume, depending on client</span></div>
            </dl>
          </div>
        </section>

        <section className="section" id="contact" aria-labelledby="contact-title">
          <div className="shell cta">
            <div>
              <p className="eyebrow">Move with confidence</p>
              <h2 id="contact-title">Make logistics your advantage.</h2>
            </div>
            <a className="button button-primary" href="mailto:hello@trackflow.example">Talk to TrackFlow</a>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="shell footer-inner">
          <div>
            <Brand footer />
            <p>Warehouse and last-mile operations across the United States and Spain.</p>
          </div>
          <p>TrackFlow · Los Angeles · Zaragoza</p>
        </div>
      </footer>
    </>
  );
}
