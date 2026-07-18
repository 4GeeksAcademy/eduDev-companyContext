import type {
  Carrier,
  Product,
  ProductCategory,
  WarehouseLocation,
} from "../types/models.js";

export function filterProductsByWarehouse(
  products: Product[],
  warehouse: WarehouseLocation,
): Product[] {
  return products.filter((product: Product) => product.warehouse === warehouse);
}

export function filterProductsByCategory(
  products: Product[],
  category: ProductCategory,
): Product[] {
  return products.filter((product: Product) => product.category === category);
}

export function filterLowStockProducts(products: Product[]): Product[] {
  return products.filter(
    (product: Product) => product.stockQuantity <= product.minStockThreshold,
  );
}

export function sortProductsByStock(
  products: Product[],
  order: "asc" | "desc",
): Product[] {
  const direction: number = order === "asc" ? 1 : -1;

  return [...products].sort(
    (first: Product, second: Product) =>
      (first.stockQuantity - second.stockQuantity) * direction,
  );
}

export function sortCarriersByReliability(
  carriers: Carrier[],
  order: "asc" | "desc",
): Carrier[] {
  const direction: number = order === "asc" ? 1 : -1;

  return [...carriers].sort(
    (first: Carrier, second: Carrier) =>
      (first.onTimeRate - second.onTimeRate) * direction,
  );
}
