import { getApiBase, protectedFetch } from '../auth.js';
import type { Product, Order, Direction, EntryInput, ExitInput } from '../types/inventory.ts';

export class InventoryError extends Error {
  status: number;
  constructor(message: string, status = 0) { super(message); this.name = 'InventoryError'; this.status = status; }
}
function detailMessage(data: unknown): string {
  if (!data || typeof data !== 'object' || !('detail' in data)) return '';
  const detail = data.detail;
  if (typeof detail === 'string') return detail.trim();
  if (!Array.isArray(detail)) return '';
  return detail.map(item => {
    if (!item || typeof item.msg !== 'string') return '';
    const field = Array.isArray(item.loc) ? item.loc.filter((key: unknown) => typeof key === 'string' && key !== 'body').join('.') : '';
    return `${field ? `${field}: ` : ''}${item.msg}`;
  }).filter(Boolean).join('; ');
}
async function request<T>(path: string, signal: AbortSignal, payload?: EntryInput | ExitInput): Promise<T> {
  signal.throwIfAborted();
  try {
    const response = await protectedFetch(`/inventory${path}`, {
      signal, method: payload ? 'POST' : 'GET',
      ...(payload ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) } : {}),
    }, process.env.NEXT_PUBLIC_INVENTORY_API_URL || getApiBase());
    let data: unknown;
    try { data = await response.json(); } catch { /* Non-JSON errors use the HTTP fallback. */ }
    signal.throwIfAborted();
    if (!response.ok) throw new InventoryError(detailMessage(data) || `Inventory request failed (HTTP ${response.status}). Please retry.`, response.status);
    if (data === undefined || data === null) throw new InventoryError('Inventory API returned an invalid response. Please retry.');
    return data as T;
  } catch (error) {
    signal.throwIfAborted();
    if (error instanceof Error && error.name === 'AbortError') throw error;
    if (error instanceof InventoryError) throw error;
    throw new InventoryError('Unable to reach inventory. Check your network and session, then retry.');
  }
}
export const listProducts = (signal: AbortSignal) => request<Product[]>('/products', signal);
export const getProduct = (id: number, signal: AbortSignal) => request<Product>(`/products/${id}`, signal);
export const listOrders = (signal: AbortSignal) => request<Order[]>('/orders', signal);
export const createMovement = (direction: Direction, payload: EntryInput | ExitInput, signal: AbortSignal) => request<Order>(`/orders/${direction}`, signal, payload);
