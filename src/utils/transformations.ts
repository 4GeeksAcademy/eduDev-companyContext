import type {
  Carrier,
  Product,
  ProductCategory,
  Shipment,
  ShipmentStatus,
} from "../types/models.js";

const priorityMultipliers: Record<Shipment["priority"], number> = {
  Standard: 1,
  Express: 1.3,
  "Same-day": 1.6,
};

function roundToTwoDecimals(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateShippingCost(
  shipment: Shipment,
  product: Product,
  carrier: Carrier,
): number {
  const subtotal: number =
    carrier.baseRateUSD +
    product.weightKg * carrier.ratePerKgUSD * shipment.quantity +
    shipment.destination.distanceKm * carrier.ratePerKmUSD;

  return roundToTwoDecimals(subtotal * priorityMultipliers[shipment.priority]);
}

export function scoreCarrierForShipment(
  carrier: Carrier,
  shipment: Shipment,
  product: Product,
): number {
  const totalWeightKg: number = product.weightKg * shipment.quantity;
  const countryScore: number = carrier.operatesIn.includes(
    shipment.destination.country,
  )
    ? 20
    : 0;
  const capacityScore: number = carrier.maxWeightKg >= totalWeightKg ? 20 : 0;
  const priorityScore: number = carrier.acceptsPriority.includes(shipment.priority)
    ? 15
    : 0;
  const fragileScore: number = !product.isFragile || carrier.handlesFragile ? 15 : 0;

  return roundToTwoDecimals(
    countryScore +
      capacityScore +
      priorityScore +
      fragileScore +
      carrier.onTimeRate * 0.3,
  );
}

export function selectBestCarrier(
  carriers: Carrier[],
  shipment: Shipment,
  product: Product,
): { carrier: Carrier; score: number; cost: number } | null {
  let bestCarrier: { carrier: Carrier; score: number; cost: number } | null = null;

  for (const carrier of carriers) {
    const score: number = scoreCarrierForShipment(carrier, shipment, product);

    if (score < 50) {
      continue;
    }

    const cost: number = calculateShippingCost(shipment, product, carrier);

    if (bestCarrier === null || cost < bestCarrier.cost) {
      bestCarrier = { carrier, score, cost };
    }
  }

  return bestCarrier;
}

export function countProductsByCategory(
  products: Product[],
): Record<ProductCategory, number> {
  const counts: Record<ProductCategory, number> = {
    Fashion: 0,
    Electronics: 0,
    Cosmetics: 0,
    Home: 0,
    Other: 0,
  };

  for (const product of products) {
    counts[product.category] += 1;
  }

  return counts;
}

export function calculateTotalInventoryValue(products: Product[]): number {
  const totalValue: number = products.reduce(
    (total: number, product: Product): number =>
      total + product.stockQuantity * product.unitCostUSD,
    0,
  );

  return roundToTwoDecimals(totalValue);
}

export function calculateAverageShipmentDistance(shipments: Shipment[]): number {
  if (shipments.length === 0) {
    return 0;
  }

  const totalDistance: number = shipments.reduce(
    (total: number, shipment: Shipment): number =>
      total + shipment.destination.distanceKm,
    0,
  );

  return roundToTwoDecimals(totalDistance / shipments.length);
}

export function groupShipmentsByStatus(
  shipments: Shipment[],
): Record<ShipmentStatus, Shipment[]> {
  const groups: Record<ShipmentStatus, Shipment[]> = {
    Pending: [],
    Assigned: [],
    "In transit": [],
    Delivered: [],
    Failed: [],
  };

  for (const shipment of shipments) {
    groups[shipment.status].push(shipment);
  }

  return groups;
}

export function findTopCarriers(
  shipments: Shipment[],
  topN: number,
): Array<{ carrier: string; count: number }> {
  if (topN <= 0) {
    return [];
  }

  const carrierCounts: Record<string, number> = {};

  for (const shipment of shipments) {
    if (shipment.carrier !== null) {
      carrierCounts[shipment.carrier] = (carrierCounts[shipment.carrier] ?? 0) + 1;
    }
  }

  return Object.entries(carrierCounts)
    .map(([carrier, count]: [string, number]) => ({ carrier, count }))
    .sort((first, second) => second.count - first.count)
    .slice(0, topN);
}
