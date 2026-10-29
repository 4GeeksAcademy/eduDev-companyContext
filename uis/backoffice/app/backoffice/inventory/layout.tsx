import { Suspense, type ReactNode } from 'react';
import InventorySessionGate from '../../../components/inventory-session-gate';
import InventoryNavigation from '../../../components/inventory-navigation';
import './inventory.css';

export default function InventoryLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<p role="status">Loading inventory session…</p>}>
    <InventorySessionGate><div className="inventory"><InventoryNavigation />
      <main id="main-content">{children}</main><footer>TrackFlow · Internal inventory · LA / ZGZ</footer>
    </div></InventorySessionGate>
  </Suspense>;
}
