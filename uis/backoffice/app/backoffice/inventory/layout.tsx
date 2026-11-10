import { Suspense, type ReactNode } from 'react';
import InventorySessionGate from '../../../components/inventory-session-gate';
import InventoryNavigation from '../../../components/inventory-navigation';
import ControlRoomSidebar from '../../../components/control-room-sidebar';
// Shared Control Room frame (header, sidebar, footer) used by the static backoffice pages.
import '../../../styles.css';
import './inventory.css';

export default function InventoryLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<p role="status">Loading inventory session…</p>}>
    <InventorySessionGate>
      <a className="skip-link" href="#main-content">Skip to inventory</a>
      <header className="topbar">
        <div className="brand-block">
          <span className="logo" aria-hidden="true">TF</span>
          <div><strong>TrackFlow</strong><span>Control Room</span></div>
        </div>
        <div className="system-state"><span aria-hidden="true"></span>Live inventory</div>
      </header>
      <div className="app-shell"><ControlRoomSidebar />
        <main id="main-content" className="inventory"><InventoryNavigation />{children}</main>
      </div>
      <footer>TrackFlow · Internal inventory · LA / ZGZ</footer>
    </InventorySessionGate>
  </Suspense>;
}
