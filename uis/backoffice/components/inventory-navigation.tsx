'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { inventoryLink } from '../lib/inventory-form';

export default function InventoryNavigation() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  return <header>
    <div className="page-heading"><div><p className="overline">Warehouse operations</p><h1>Inventory</h1>
      <p>Stock and movements for the Los Angeles (LA) and Zaragoza (ZGZ) warehouses.</p></div></div>
    <nav aria-label="Inventory" className="inventory-tabs">{[
      ['products', 'SKUs'], ['orders/inbound', 'Goods receipt / stock entry'],
      ['orders/outbound', 'Dispatch or loss / stock exit'], ['orders', 'Movement history'],
    ].map(([route, label]) => {
      const path = `/backoffice/inventory/${route}`;
      return <Link key={route} href={inventoryLink(path, search)} aria-current={pathname === path ? 'page' : undefined}>{label}</Link>;
    })}</nav></header>;
}
