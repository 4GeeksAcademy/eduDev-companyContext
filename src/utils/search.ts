import type { Product, Shipment } from "../types/models.js";

export function findProductBySKU(
  products: Product[],
  sku: string,
): Product | null {
  const normalizedSku: string = sku.toLowerCase();

  return (
    products.find(
      (product: Product) => product.sku.toLowerCase() === normalizedSku,
    ) ?? null
  );
}

export function findShipmentById(
  shipments: Shipment[],
  id: string,
): Shipment | null {
  return shipments.find((shipment: Shipment) => shipment.id === id) ?? null;
}

export function binarySearchProductByWeight(
  sortedProducts: Product[],
  targetWeight: number,
): number {
  let low: number = 0;
  let high: number = sortedProducts.length - 1;

  while (low <= high) {
    const middle: number = Math.floor((low + high) / 2);
    const product: Product | undefined = sortedProducts[middle];

    if (product === undefined) {
      return -1;
    }

    if (product.weightKg === targetWeight) {
      return middle;
    }

    if (product.weightKg < targetWeight) {
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return -1;
}
