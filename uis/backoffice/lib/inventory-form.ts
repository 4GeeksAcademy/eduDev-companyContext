import type { Product, Direction, ExitType, EntryInput, ExitInput } from '../types/inventory.ts';

export function movementPayload(product: Pick<Product, 'id' | 'warehouse'> | null, quantity: string,
  direction: Direction, reference: string, exitType: ExitType = 'dispatch', tracking = ''): EntryInput | ExitInput {
  if (!product) throw new Error('Select a SKU.');
  const count = Number(quantity);
  if (!/^\d+$/.test(quantity) || !Number.isSafeInteger(count) || count <= 0) throw new Error('Quantity must be a positive integer.');
  const base = { sku_id: product.id, warehouse: product.warehouse, quantity: count };
  if (direction === 'inbound') {
    if (!reference.trim()) throw new Error('A goods receipt reference is required.');
    return { ...base, reference: reference.trim() };
  }
  if (exitType === 'dispatch' && !tracking.trim()) throw new Error('Dispatch requires a tracking number.');
  return { ...base, exit_type: exitType, tracking_number: exitType === 'dispatch' ? tracking.trim() : null };
}
export function stockWarning(quantity: string, stock: number): string {
  return Number(quantity) > stock ? 'Quantity exceeds displayed stock. The server will check availability again.' : '';
}
export function inventoryLink(path: string, search: string, skuId?: number): string {
  const query = new URLSearchParams();
  const port = new URLSearchParams(search).get('apiPort') ?? '';
  if (/^\d+$/.test(port) && Number(port) >= 1 && Number(port) <= 65535) query.set('apiPort', String(Number(port)));
  if (skuId) query.set('sku_id', String(skuId));
  return path + (query.size ? `?${query}` : '');
}
