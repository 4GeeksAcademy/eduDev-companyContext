import {
  sampleCarriers,
  sampleProducts,
  sampleShipment,
  sampleShipments,
} from "./data/sampleData.js";
import {
  filterLowStockProducts,
  filterProductsByCategory,
  filterProductsByWarehouse,
  sortCarriersByReliability,
  sortProductsByStock,
} from "./utils/collections.js";
import {
  binarySearchProductByWeight,
  findProductBySKU,
  findShipmentById,
} from "./utils/search.js";
import {
  calculateAverageShipmentDistance,
  calculateShippingCost,
  calculateTotalInventoryValue,
  countProductsByCategory,
  findTopCarriers,
  groupShipmentsByStatus,
  scoreCarrierForShipment,
  selectBestCarrier,
} from "./utils/transformations.js";
import {
  validateCarrier,
  validateProduct,
  validateShipment,
} from "./utils/validations.js";
import type { Carrier, Product, Shipment, ValidationResult } from "./types/models.js";

const byId = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (element === null) throw new Error(`Missing #${id}`);
  return element as T;
};

const text = (value: unknown): string => String(value);
const money = (value: number): string => `$${value.toFixed(2)} USD`;

function clear(element: HTMLElement): void { element.replaceChildren(); }
function card(title: string, lines: string[]): HTMLElement {
  const container = document.createElement("article");
  container.className = "rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700";
  const heading = document.createElement("h3");
  heading.className = "font-semibold text-slate-950";
  heading.textContent = title;
  const list = document.createElement("ul");
  list.className = "mt-2 space-y-1";
  for (const line of lines) { const item = document.createElement("li"); item.textContent = line; list.append(item); }
  container.append(heading, list);
  return container;
}
function empty(message: string): HTMLElement { return card("Sin resultados", [message]); }
function addOptions(select: HTMLSelectElement, options: Array<{ value: string; label: string }>): void {
  select.replaceChildren();
  for (const optionData of options) { const option = document.createElement("option"); option.value = optionData.value; option.textContent = optionData.label; select.append(option); }
}

const warehouseFilter = byId<HTMLSelectElement>("warehouse-filter");
const categoryFilter = byId<HTMLSelectElement>("category-filter");
const skuSearch = byId<HTMLInputElement>("sku-search");
const weightSearch = byId<HTMLSelectElement>("weight-search");
const stockOrder = byId<HTMLSelectElement>("stock-order");
const lowStockFilter = byId<HTMLInputElement>("low-stock-filter");
const shipmentSelect = byId<HTMLSelectElement>("shipment-select");
const productSelect = byId<HTMLSelectElement>("carrier-product-select");
const carrierSelect = byId<HTMLSelectElement>("carrier-select");

addOptions(warehouseFilter, [{ value: "all", label: "Todos" }, ...["Los Angeles", "Zaragoza"].map((value) => ({ value, label: value }))]);
addOptions(categoryFilter, [{ value: "all", label: "Todas" }, ...["Fashion", "Electronics", "Cosmetics", "Home", "Other"].map((value) => ({ value, label: value }))]);
addOptions(weightSearch, [{ value: "", label: "No buscar" }, ...sampleProducts.map((product) => ({ value: text(product.weightKg), label: `${product.weightKg} kg · ${product.sku}` }))]);
addOptions(shipmentSelect, sampleShipments.map((shipment) => ({ value: shipment.id, label: `${shipment.id} · ${shipment.destination.city}` })));
addOptions(productSelect, sampleProducts.map((product) => ({ value: product.sku, label: `${product.sku} · ${product.name}` })));
addOptions(carrierSelect, sampleCarriers.map((carrier) => ({ value: carrier.id, label: carrier.name })));

function selectedProduct(): Product { return sampleProducts.find((product) => product.sku === productSelect.value) ?? sampleProducts[0]!; }
function selectedShipment(): Shipment { return findShipmentById(sampleShipments, shipmentSelect.value) ?? sampleShipment; }
function selectedCarrier(): Carrier { return sampleCarriers.find((carrier) => carrier.id === carrierSelect.value) ?? sampleCarriers[0]!; }

function renderInventory(): void {
  let products = sampleProducts;
  if (warehouseFilter.value !== "all") products = filterProductsByWarehouse(products, warehouseFilter.value as Product["warehouse"]);
  if (categoryFilter.value !== "all") products = filterProductsByCategory(products, categoryFilter.value as Product["category"]);
  if (lowStockFilter.checked) products = filterLowStockProducts(products);
  products = sortProductsByStock(products, stockOrder.value as "asc" | "desc");
  const results = byId<HTMLDivElement>("inventory-results");
  clear(results);
  results.append(products.length === 0 ? empty("Ningún producto cumple los filtros.") : card("Productos filtrados", products.map((product) => `${product.sku}: ${product.stockQuantity} unidades (${product.warehouse})`)));

  const searches = byId<HTMLDivElement>("inventory-search-results");
  clear(searches);
  const foundBySku = skuSearch.value.trim() === "" ? null : findProductBySKU(sampleProducts, skuSearch.value.trim());
  const sortedByWeight = [...sampleProducts].sort((first, second) => first.weightKg - second.weightKg);
  const weight = Number(weightSearch.value);
  const weightIndex = weightSearch.value === "" ? -1 : binarySearchProductByWeight(sortedByWeight, weight);
  const lines: string[] = [];
  if (skuSearch.value.trim() !== "") lines.push(foundBySku === null ? "SKU: no encontrado." : `SKU: ${foundBySku.name} (${foundBySku.weightKg} kg).`);
  if (weightSearch.value !== "") lines.push(weightIndex < 0 ? "Peso: no encontrado." : `Peso: posición ${weightIndex} (${sortedByWeight[weightIndex]!.sku}).`);
  searches.append(lines.length === 0 ? empty("Ingresá un SKU o elegí un peso para buscar.") : card("Búsquedas", lines));
}

function renderCarrier(): void {
  const shipment = selectedShipment(); const product = selectedProduct(); const carrier = selectedCarrier();
  const result = byId<HTMLDivElement>("carrier-results"); clear(result);
  const cost = calculateShippingCost(shipment, product, carrier);
  const score = scoreCarrierForShipment(carrier, shipment, product);
  const best = selectBestCarrier(sampleCarriers, shipment, product);
  result.append(card("Alternativa seleccionada", [`${carrier.name}: costo ${money(cost)}.`, `Puntaje: ${score}/100.`, best === null ? "Mejor opción: no hay carrier elegible." : `Mejor opción: ${best.carrier.name} · ${best.score}/100 · ${money(best.cost)}.`]));
  const reliability = byId<HTMLDivElement>("reliability-results"); clear(reliability);
  reliability.append(card("Confiabilidad", sortCarriersByReliability(sampleCarriers, "desc").map((item) => `${item.name}: ${item.onTimeRate}% a tiempo.`)));
}

function validationLine(label: string, validation: ValidationResult): string { return validation.valid ? `${label}: válido.` : `${label}: ${validation.errors.join(" ")}`; }
function renderReports(): void {
  const report = byId<HTMLDivElement>("report-results"); clear(report);
  const categoryCounts = countProductsByCategory(sampleProducts);
  const statusGroups = groupShipmentsByStatus(sampleShipments);
  const topN = Number(byId<HTMLSelectElement>("top-n").value);
  report.append(
    card("Inventario", [`Valor total: ${money(calculateTotalInventoryValue(sampleProducts))}.`, ...Object.entries(categoryCounts).map(([category, count]) => `${category}: ${count}.`)]),
    card("Envíos", [`Distancia promedio: ${calculateAverageShipmentDistance(sampleShipments)} km.`, ...Object.entries(statusGroups).map(([status, shipments]) => `${status}: ${shipments.length}.`)]),
    card("Carriers frecuentes", findTopCarriers(sampleShipments, topN).map((item) => `${item.carrier}: ${item.count} envío(s).`)),
    card("Validaciones", [validationLine("Producto", validateProduct(selectedProduct())), validationLine("Envío", validateShipment(selectedShipment())), validationLine("Carrier", validateCarrier(selectedCarrier()))]),
  );
}

byId<HTMLButtonElement>("run-inventory").addEventListener("click", renderInventory);
byId<HTMLButtonElement>("run-carrier").addEventListener("click", renderCarrier);
byId<HTMLButtonElement>("run-reports").addEventListener("click", renderReports);
shipmentSelect.addEventListener("change", () => { const shipment = selectedShipment(); productSelect.value = shipment.sku; renderCarrier(); renderReports(); });
renderInventory(); renderCarrier(); renderReports();
