class TrackFlowHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <header class="site-header">
        <div class="shell header-inner">
          <a class="brand" href="./" aria-label="TrackFlow home">
            <span class="brand-mark" aria-hidden="true">TF</span>
            <span>TrackFlow</span>
          </a>
          <nav aria-label="Primary navigation">
            <a href="#capabilities">Capabilities</a>
            <a href="#footprint">Footprint</a>
            <a class="nav-cta" href="#contact">Contact</a>
          </nav>
        </div>
      </header>
    `;
  }
}

class ServiceCard extends HTMLElement {
  connectedCallback() {
    const number = this.getAttribute("number") ?? "";
    const heading = this.getAttribute("heading") ?? "";
    const text = this.getAttribute("text") ?? "";

    this.innerHTML = `
      <article class="service-card">
        <span class="service-number" aria-hidden="true">${number}</span>
        <h3>${heading}</h3>
        <p>${text}</p>
      </article>
    `;
  }
}

class TrackFlowFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer class="site-footer">
        <div class="shell footer-inner">
          <div>
            <a class="brand brand-footer" href="./" aria-label="TrackFlow home">
              <span class="brand-mark" aria-hidden="true">TF</span>
              <span>TrackFlow</span>
            </a>
            <p>Warehouse and last-mile operations across the United States and Spain.</p>
          </div>
          <p>TrackFlow · Los Angeles · Zaragoza</p>
        </div>
      </footer>
    `;
  }
}

customElements.define("trackflow-header", TrackFlowHeader);
customElements.define("service-card", ServiceCard);
customElements.define("trackflow-footer", TrackFlowFooter);
