import type {
  Carrier,
  Product,
  Shipment,
  ValidationResult,
} from "../types/models.js";

const isFiniteNumber = (value: number): boolean => Number.isFinite(value);

export const validateProduct = (product: Product): ValidationResult => {
  const errors: string[] = [];

  if (product.sku.trim().length === 0) {
    errors.push("SKU must not be empty.");
  }

  if (!isFiniteNumber(product.weightKg) || product.weightKg <= 0 || product.weightKg > 100) {
    errors.push("Weight must be greater than 0 and at most 100 kg.");
  }

  const dimensions = [
    ["Length", product.dimensions.lengthCm],
    ["Width", product.dimensions.widthCm],
    ["Height", product.dimensions.heightCm],
  ] as const;

  for (const [name, value] of dimensions) {
    if (!isFiniteNumber(value) || value <= 0 || value > 200) {
      errors.push(`${name} must be greater than 0 and at most 200 cm.`);
    }
  }

  if (!isFiniteNumber(product.stockQuantity) || product.stockQuantity < 0) {
    errors.push("Stock quantity must be at least 0.");
  }

  if (!isFiniteNumber(product.minStockThreshold) || product.minStockThreshold < 0) {
    errors.push("Minimum stock threshold must be at least 0.");
  }

  if (!isFiniteNumber(product.unitCostUSD) || product.unitCostUSD <= 0) {
    errors.push("Unit cost must be greater than 0.");
  }

  return { valid: errors.length === 0, errors };
};

export const validateShipment = (shipment: Shipment): ValidationResult => {
  const errors: string[] = [];

  if (!isFiniteNumber(shipment.quantity) || shipment.quantity <= 0) {
    errors.push("Quantity must be greater than 0.");
  }

  if (!isFiniteNumber(shipment.declaredValueUSD) || shipment.declaredValueUSD <= 0) {
    errors.push("Declared value must be greater than 0.");
  }

  if (
    !isFiniteNumber(shipment.destination.distanceKm) ||
    shipment.destination.distanceKm < 0
  ) {
    errors.push("Distance must be at least 0 km.");
  }

  return { valid: errors.length === 0, errors };
};

export const validateCarrier = (carrier: Carrier): ValidationResult => {
  const errors: string[] = [];

  const rates = [
    ["Base rate", carrier.baseRateUSD],
    ["Rate per kg", carrier.ratePerKgUSD],
    ["Rate per km", carrier.ratePerKmUSD],
  ] as const;

  for (const [name, value] of rates) {
    if (!isFiniteNumber(value) || value < 0) {
      errors.push(`${name} must be at least 0.`);
    }
  }

  if (!isFiniteNumber(carrier.avgDeliveryDays) || carrier.avgDeliveryDays <= 0) {
    errors.push("Average delivery days must be greater than 0.");
  }

  if (
    !isFiniteNumber(carrier.onTimeRate) ||
    carrier.onTimeRate < 0 ||
    carrier.onTimeRate > 100
  ) {
    errors.push("On-time rate must be between 0 and 100.");
  }

  if (!isFiniteNumber(carrier.maxWeightKg) || carrier.maxWeightKg <= 0) {
    errors.push("Maximum weight must be greater than 0 kg.");
  }

  if (carrier.operatesIn.length < 1) {
    errors.push("Carrier must operate in at least one country.");
  }

  return { valid: errors.length === 0, errors };
};
