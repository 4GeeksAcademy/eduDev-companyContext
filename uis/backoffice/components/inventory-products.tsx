'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { listProducts } from '../lib/inventory';
import { inventoryLink } from '../lib/inventory-form';
import type { Product } from '../types/inventory';

export default function InventoryProducts() {
  const search = useSearchParams().toString();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setProducts(null); setError('');
    void listProducts(controller.signal).then(data => { if (!controller.signal.aborted) setProducts(data); })
      .catch(error => { if (!controller.signal.aborted) setError(error.message); });
    return () => controller.abort();
  }, [attempt]);
  return <section><h2>Live SKUs</h2>
    {error ? <p role="alert">{error} <button onClick={() => setAttempt(x => x + 1)}>Retry</button></p> :
      products === null ? <p role="status">Loading SKUs…</p> : products.length === 0 ? <p>No SKUs available.</p> :
        <div className="table-scroll"><table><caption>Stock by SKU and warehouse</caption><thead><tr>
          {['Name', 'SKU code', 'Client', 'Category', 'Warehouse', 'Current stock', 'Actions'].map(x => <th key={x} scope="col">{x}</th>)}
        </tr></thead><tbody>{products.map(product => {
          // Bootcamp low-stock threshold: fewer than 10 units; 10 or more is healthy.
          const low = product.current_stock < 10;
          return <tr key={product.id}><th scope="row">{product.name}</th><td>{product.sku}</td><td>{product.client_name}</td>
            <td>{product.category}</td><td>{product.warehouse}</td><td><span className={low ? 'stock-low' : 'stock-healthy'}>
              {product.current_stock} — {product.current_stock === 0 ? 'Out of stock' : low ? 'Low stock' : 'Healthy stock'}</span></td>
            <td>{(['inbound', 'outbound'] as const).map(direction => <Link key={direction}
              href={inventoryLink(`/backoffice/inventory/orders/${direction}`, search, product.id)}>
              {direction === 'inbound' ? 'Stock entry' : 'Stock exit'}<span className="sr-only"> for {product.name}</span></Link>)}</td></tr>;
        })}</tbody></table></div>}
  </section>;
}
