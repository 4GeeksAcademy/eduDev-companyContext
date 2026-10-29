'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { createMovement, getProduct, InventoryError, listProducts } from '../lib/inventory';
import { movementPayload, stockWarning } from '../lib/inventory-form';
import type { Direction, ExitType, Product } from '../types/inventory';

export default function InventoryOrderForm({ direction }: { direction: Direction }) {
  const prefill = useSearchParams().get('sku_id') ?? '';
  const outbound = direction === 'outbound';
  const [products, setProducts] = useState<Product[] | null>(null);
  const [skuId, setSkuId] = useState(prefill);
  const [detail, setDetail] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('');
  const [reference, setReference] = useState('');
  const [exitType, setExitType] = useState<ExitType>('dispatch');
  const [tracking, setTracking] = useState('');
  const [loadError, setLoadError] = useState('');
  const [stockError, setStockError] = useState('');
  const [error, setError] = useState('');
  const [quantityError, setQuantityError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [stockAttempt, setStockAttempt] = useState(0);
  const submitController = useRef<AbortController | null>(null);
  useEffect(() => () => { submitController.current?.abort(); }, []);
  useEffect(() => {
    const controller = new AbortController();
    setProducts(null); setLoadError('');
    void listProducts(controller.signal).then(data => { if (!controller.signal.aborted) setProducts(data); })
      .catch(error => { if (!controller.signal.aborted) setLoadError(error.message); });
    return () => controller.abort();
  }, [attempt]);
  useEffect(() => {
    const controller = new AbortController();
    setDetail(null); setStockError('');
    if (outbound && skuId && products?.some(product => String(product.id) === skuId)) {
      void getProduct(Number(skuId), controller.signal).then(data => {
        if (!controller.signal.aborted) setDetail(data);
      }).catch(error => { if (!controller.signal.aborted) setStockError(error.message); });
    }
    return () => controller.abort();
  }, [skuId, outbound, products, stockAttempt]);
  const selected = products?.find(product => String(product.id) === skuId) ?? null;
  const product = outbound ? (detail && String(detail.id) === skuId ? detail : null) : selected;
  const warning = outbound && product ? stockWarning(quantity, product.current_stock) : '';
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitController.current || !product) return;
    setError(''); setQuantityError(''); setSuccess('');
    let payload;
    try { payload = movementPayload(product, quantity, direction, reference, exitType, tracking); }
    catch (error) { setError((error as Error).message); return; }
    const controller = new AbortController();
    submitController.current = controller; setSaving(true);
    try {
      await createMovement(direction, payload, controller.signal);
      if (controller.signal.aborted) return;
      setSkuId(''); setDetail(null); setQuantity(''); setReference(''); setTracking(''); setExitType('dispatch');
      setSuccess(outbound ? 'Stock exit recorded successfully.' : 'Goods receipt recorded successfully.');
    } catch (error) {
      if (controller.signal.aborted) return;
      const message = (error as Error).message;
      if (error instanceof InventoryError && error.status === 400) setQuantityError(message);
      else setError(message);
    } finally {
      if (!controller.signal.aborted) { submitController.current = null; setSaving(false); }
    }
  }
  return <section><h2>{outbound ? 'Dispatch or loss / stock exit' : 'Goods receipt / stock entry'}</h2>
    {loadError ? <p role="alert">{loadError} <button onClick={() => setAttempt(x => x + 1)}>Retry SKUs</button></p> :
      products === null ? <p role="status">Loading SKUs…</p> : products.length === 0 ? <p>No SKUs available. A SKU must exist before recording movements.</p> :
        <form onSubmit={submit}>
          <fieldset disabled={saving}><legend>Movement details</legend>
            <label htmlFor="inventory-sku">SKU</label><select id="inventory-sku" required value={selected ? skuId : ''} onChange={event => {
              setSkuId(event.target.value); setQuantity(''); setDetail(null); setStockError(''); setError(''); setQuantityError(''); setSuccess('');
            }}><option value="">Select a SKU</option>{products.map(product => <option key={product.id} value={product.id}>{product.name} — {product.sku} — {product.warehouse}</option>)}</select>
            {selected && <p>Warehouse: <strong>{selected.warehouse}</strong></p>}
            {outbound && selected && (stockError ? <p role="alert">{stockError} <button type="button" onClick={() => setStockAttempt(x => x + 1)}>Retry stock</button></p> :
              product ? <p role="status">Current stock: <strong>{product.current_stock}</strong></p> : <p role="status">Loading current stock…</p>)}
            <label htmlFor="inventory-quantity">Quantity (positive integer)</label><input id="inventory-quantity" type="number" min="1" step="1" required disabled={!product}
              value={quantity} onChange={event => { setQuantity(event.target.value); setQuantityError(''); }} aria-describedby="quantity-feedback" aria-invalid={!!quantityError} />
            <div id="quantity-feedback">{warning && <p role="status" className="stock-low">{warning}</p>}{quantityError && <p role="alert">{quantityError}</p>}</div>
            {outbound ? <><label htmlFor="inventory-exit">Exit type</label><select id="inventory-exit" value={exitType} onChange={event => { setExitType(event.target.value as ExitType); setTracking(''); }}>
              <option value="dispatch">Dispatch</option><option value="loss">Loss</option></select>
              {exitType === 'dispatch' && <><label htmlFor="inventory-tracking">Tracking number</label><input id="inventory-tracking" required value={tracking} onChange={event => setTracking(event.target.value)} /></>}
            </> : <><label htmlFor="inventory-reference">Goods receipt reference</label><input id="inventory-reference" required value={reference} onChange={event => setReference(event.target.value)} /></>}
            <button type="submit" disabled={!product || saving}>{saving ? 'Recording…' : 'Record stock ' + (outbound ? 'exit' : 'entry')}</button>
          </fieldset>
        </form>}
    {error && <p role="alert">{error}</p>}{success && <p role="status">{success}</p>}
  </section>;
}
