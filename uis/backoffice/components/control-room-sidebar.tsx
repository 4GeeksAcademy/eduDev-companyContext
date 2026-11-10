'use client';
import { useSearchParams } from 'next/navigation';
import { logout } from '../auth.js';

// Same menu as the static Control Room pages, with Inventory as the current section.
const sections = [
  ['Operations overview', '/uis/backoffice/index.html'],
  ['Inventory', '/backoffice/inventory/products'],
  ['Incident analysis', '/uis/backoffice/incident-analysis.html'],
  ['Incident manager', '/uis/backoffice/incidents.html'],
  ['Supplier directory', '/uis/backoffice/suppliers.html'],
];

export default function ControlRoomSidebar() {
  const search = useSearchParams().toString();
  return <aside className="sidebar" aria-label="Application menu">
    <p className="sidebar-label">Workspace</p>
    <nav className="sidebar-nav">{sections.map(([label, path]) => {
      const current = label === 'Inventory';
      return <a key={path} href={`${path}${search ? `?${search}` : ''}`}
        className={current ? 'active-item' : undefined} aria-current={current ? 'page' : undefined}>{label}</a>;
    })}</nav>
    <button type="button" onClick={logout}>Sign out</button>
    <div className="shift-card">
      <span>Warehouses</span>
      <strong>Los Angeles + Zaragoza</strong>
      <small>Live stock and movements</small>
    </div>
  </aside>;
}
