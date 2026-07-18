import {
  additionalSampleShipments,
  binarySearchProductByWeight,
  calculateAverageShipmentDistance,
  calculateShippingCost,
  calculateTotalInventoryValue,
  countProductsByCategory,
  filterLowStockProducts,
  filterProductsByCategory,
  filterProductsByWarehouse,
  findProductBySKU,
  findShipmentById,
  findTopCarriers,
  groupShipmentsByStatus,
  sampleCarriers,
  sampleProducts,
  sampleShipment,
  scoreCarrierForShipment,
  selectBestCarrier,
  sortCarriersByReliability,
  sortProductsByStock,
  validateCarrier,
  validateProduct,
  validateShipment,
} from "./index.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Demo assertion failed: ${message}`);
  }
}

const laptop = findProductBySKU(sampleProducts, sampleShipment.sku);
assert(laptop !== null, "the shipment product should exist");

const productOrderBefore = sampleProducts.map((product) => product.sku).join(",");
const carrierOrderBefore = sampleCarriers.map((carrier) => carrier.id).join(",");
const byWarehouse = filterProductsByWarehouse(sampleProducts, "Los Angeles");
const byCategory = filterProductsByCategory(sampleProducts, "Electronics");
const lowStock = filterLowStockProducts(sampleProducts);
const byStock = sortProductsByStock(sampleProducts, "asc");
const byReliability = sortCarriersByReliability(sampleCarriers, "desc");

assert(byWarehouse.length === 2, "Los Angeles should have two products");
assert(sampleProducts.map((product) => product.sku).join(",") === productOrderBefore, "product sorting must not mutate input");
assert(sampleCarriers.map((carrier) => carrier.id).join(",") === carrierOrderBefore, "carrier sorting must not mutate input");
console.log("Collections", {
  losAngeles: byWarehouse.length,
  electronics: byCategory.length,
  lowStock: lowStock.map((product) => product.sku),
  stockAscending: byStock.map((product) => product.sku),
  mostReliable: byReliability[0]?.name,
});

const shipment = findShipmentById([sampleShipment, ...additionalSampleShipments], sampleShipment.id);
const productsByWeight = [...sampleProducts].sort((first, second) => first.weightKg - second.weightKg);
const laptopWeightIndex = binarySearchProductByWeight(productsByWeight, laptop.weightKg);

assert(findProductBySKU([], "MISSING") === null, "empty product search should return null");
assert(findShipmentById([], "MISSING") === null, "empty shipment search should return null");
assert(shipment?.id === sampleShipment.id && laptopWeightIndex >= 0, "searches should find sample records");
console.log("Searches", { product: laptop.sku, shipment: shipment.id, laptopWeightIndex });

const shippingCost = calculateShippingCost(sampleShipment, laptop, sampleCarriers[1]!);
const carrierScore = scoreCarrierForShipment(sampleCarriers[1]!, sampleShipment, laptop);
const bestCarrier = selectBestCarrier(sampleCarriers, sampleShipment, laptop);

assert(bestCarrier !== null && bestCarrier.carrier.name === "UPS", "UPS should be the lowest-cost carrier above the score threshold");
assert(selectBestCarrier([], sampleShipment, laptop) === null, "no carriers should produce no selection");
console.log("Carrier selection", { shippingCost, carrierScore, selected: bestCarrier.carrier.name, selectedCost: bestCarrier.cost });

const shipments = [sampleShipment, ...additionalSampleShipments];
const categoryCounts = countProductsByCategory(sampleProducts);
const inventoryValue = calculateTotalInventoryValue(sampleProducts);
const averageDistance = calculateAverageShipmentDistance(shipments);
const statusGroups = groupShipmentsByStatus(shipments);
const topCarriers = findTopCarriers(shipments, 2);

assert(calculateAverageShipmentDistance([]) === 0, "empty shipment averages should be zero");
assert(findTopCarriers([], 2).length === 0, "empty carrier reports should be empty");
console.log("Reports", { categoryCounts, inventoryValue, averageDistance, delivered: statusGroups.Delivered.length, topCarriers });

const invalidProduct = validateProduct({ ...laptop, weightKg: 0 });
const shipmentValidation = validateShipment(sampleShipment);
const carrierValidation = validateCarrier(sampleCarriers[1]!);

assert(!invalidProduct.valid && invalidProduct.errors.length > 0, "invalid products should report errors");
assert(shipmentValidation.valid && carrierValidation.valid, "sample shipment and carrier should be valid");
console.log("Validations", { invalidProductErrors: invalidProduct.errors.length, shipmentValid: shipmentValidation.valid, carrierValid: carrierValidation.valid });

console.log("TrackFlow demo passed: 19 functions executed and representative assertions succeeded.");
