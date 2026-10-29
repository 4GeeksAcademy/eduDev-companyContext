import test from 'node:test';
import assert from 'node:assert/strict';
import { movementPayload, stockWarning, inventoryLink } from '../lib/inventory-form.ts';
const product = { id: 4, warehouse: 'ZGZ', current_stock: 8 };
test('positive integer quantities, reference and warehouse come from the selected SKU', () => {
  assert.deepEqual(movementPayload(product, '2', 'inbound', ' receipt '), { sku_id: 4, warehouse: 'ZGZ', quantity: 2, reference: 'receipt' });
  for (const quantity of ['', '0', '-1', '1.2', '2e2', 'Infinity']) assert.throws(() => movementPayload(product, quantity, 'inbound', 'ref'), /positive integer/);
  assert.throws(() => movementPayload(product, '1', 'inbound', ' '), /reference/i);
  assert.throws(() => movementPayload(null, '1', 'inbound', 'ref'), /SKU/);
});
test('dispatch needs tracking; loss sends null; stock warning leaves backend authoritative', () => {
  assert.throws(() => movementPayload(product, '1', 'outbound', '', 'dispatch', ' '), /tracking/i);
  assert.equal(movementPayload(product, '1', 'outbound', '', 'loss', 'unused').tracking_number, null);
  assert.equal(movementPayload(product, '1', 'outbound', '', 'dispatch', ' TRK ').tracking_number, 'TRK');
  assert.equal(stockWarning('8', 8), '');
  assert.match(stockWarning('9', 8), /exceeds/);
  assert.equal(stockWarning('', 8), '');
});
test('links carry only validated port and explicit SKU prefill', () => {
  assert.equal(inventoryLink('/backoffice/inventory/orders/inbound', '?apiPort=8001&token=bad&apiUrl=evil', 4), '/backoffice/inventory/orders/inbound?apiPort=8001&sku_id=4');
  assert.equal(inventoryLink('/backoffice/inventory/orders', '?apiPort=65536'), '/backoffice/inventory/orders');
});
