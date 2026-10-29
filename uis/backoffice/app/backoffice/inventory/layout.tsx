import { Suspense, type ReactNode } from 'react';
import InventorySessionGate from '../../../components/inventory-session-gate';

export default function InventoryLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<p role="status">Loading inventory session…</p>}>
    <InventorySessionGate>{children}</InventorySessionGate>
  </Suspense>;
}
