'use client';
import { useEffect, useState } from 'react';
import { listOrders } from '../lib/inventory';
import type { Order } from '../types/inventory';

export default function InventoryHistory() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setOrders(null); setError('');
    void listOrders(controller.signal).then(data => { if (!controller.signal.aborted) setOrders(data); })
      .catch(error => { if (!controller.signal.aborted) setError(error.message); });
    return () => controller.abort();
  }, [attempt]);
  return <section><h2>Movement history</h2><p>Read-only goods receipts, dispatches and losses.</p>
    {error ? <p role="alert">{error} <button onClick={() => setAttempt(x => x + 1)}>Retry</button></p> :
      orders === null ? <p role="status">Loading movements…</p> : orders.length === 0 ? <p>No movements recorded.</p> :
        <div className="table-scroll"><table><caption>All inventory movements</caption><thead><tr>
          {['SKU', 'Quantity', 'Movement', 'Warehouse', 'Created', 'User UUID', 'Details'].map(x => <th scope="col" key={x}>{x}</th>)}
        </tr></thead><tbody>{orders.map(order => <tr key={`${order.order_type}-${order.id}`}>
          <th scope="row">{order.name} ({order.sku})</th><td>{order.quantity}</td>
          <td><span className={order.order_type === 'inbound' ? 'stock-healthy' : 'stock-low'}>{order.order_type === 'inbound' ? 'Inbound — stock entry' : 'Outbound — stock exit'}</span></td>
          <td>{order.warehouse}</td><td><time dateTime={order.created_at}>{new Date(order.created_at).toLocaleString('en-GB')}</time></td>
          <td className="uuid">{order.user_uuid}</td><td>{order.order_type === 'inbound' ? order.reference : `${order.exit_type}${order.tracking_number ? ` — ${order.tracking_number}` : ''}`}</td>
        </tr>)}</tbody></table></div>}
  </section>;
}
