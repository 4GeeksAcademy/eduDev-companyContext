'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { inventoryLink } from '../lib/inventory-form';

export default function InventoryNavigation() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  return <header><h1>TrackFlow inventory</h1><p>LA / ZGZ warehouse operations</p>
    <nav aria-label="Inventory">{[
      ['products', 'SKUs'], ['orders/inbound', 'Goods receipt / stock entry'],
      ['orders/outbound', 'Dispatch or loss / stock exit'], ['orders', 'Movement history'],
    ].map(([route, label]) => {
      const path = `/backoffice/inventory/${route}`;
      return <Link key={route} href={inventoryLink(path, search)} aria-current={pathname === path ? 'page' : undefined}>{label}</Link>;
    })}</nav></header>;
}
