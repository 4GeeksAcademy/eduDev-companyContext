'use client';
import { lazy, Suspense } from 'react';
import type { Direction } from '../types/inventory';

// The existing session gate mounts these boundaries only after validation.
const History = lazy(() => import('./inventory-history'));
const OrderForm = lazy(() => import('./inventory-order-form'));

export function LazyInventoryHistory() {
  return <Suspense fallback={<p role="status">Loading movements…</p>}><History /></Suspense>;
}

export function LazyInventoryOrderForm({ direction }: { direction: Direction }) {
  return <Suspense fallback={<p role="status">Loading SKUs…</p>}><OrderForm direction={direction} /></Suspense>;
}
