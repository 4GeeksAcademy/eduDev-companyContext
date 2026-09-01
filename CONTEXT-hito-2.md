# CONTEXTO — TrackFlow

**Hito 2: Fundamentos de Programación**
**Empresa:** TrackFlow — Gestión de Última Milla y Almacenes
**Tu Rol:** Ingeniero de IA Junior, Equipo TrackFlow Tech
**Responsable del Proyecto:** Ana Whitfield, Directora de Operaciones de Almacén

---

## Acerca de TrackFlow

TrackFlow es una empresa de gestión de última milla y almacenes que opera en Estados Unidos (Los Ángeles) y España (Zaragoza). La empresa gestiona almacenes para marcas de e-commerce y maneja la entrega final a los clientes finales. Eres parte de TrackFlow Tech, la unidad interna que lidera la transformación digital de la empresa.

---

## Tu Asignación

Ana Whitfield necesita que construyas la lógica central de procesamiento de datos para los sistemas de gestión de almacenes y transportistas de TrackFlow. Actualmente, los gerentes de almacén y coordinadores logísticos manejan todo manualmente — rastreando inventario, puntuando transportistas, calculando costos de envío, y gestionando cumplimiento de pedidos. Este hito se enfoca en construir las funciones TypeScript que alimentarán el control de inventario y la selección de transportistas.

Esto es programación pura — sin IA, sin prompting. Ana necesita código confiable que no se rompa al procesar miles de pedidos por día.

---

## Lo que Estás Construyendo

Implementarás un conjunto de utilidades TypeScript para:

1. **Modelar datos de envíos, inventario y transportistas** usando interfaces
2. **Filtrar y buscar inventario** por SKU, ubicación y niveles de stock
3. **Puntuar transportistas** basado en costo, velocidad y confiabilidad
4. **Calcular costos de envío** basados en peso, distancia y tarifas de transportista
5. **Generar reportes de almacén** con métricas agregadas
6. **Validar datos** antes de procesar pedidos

---

## Entidades de Negocio

### Producto (Product)

Representa un producto almacenado en los almacenes de TrackFlow.

**Interfaz: `Product`**

```typescript
interface Product {
  sku: string;
  name: string;
  category: ProductCategory;
  weightKg: number;
  dimensions: Dimensions;
  warehouse: WarehouseLocation;
  stockQuantity: number;
  minStockThreshold: number;
  unitCostUSD: number;
  isFragile: boolean;
  status: ProductStatus;
}

interface Dimensions {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}

type ProductCategory =
  | "Fashion"
  | "Electronics"
  | "Cosmetics"
  | "Home"
  | "Other";
type WarehouseLocation = "Los Angeles" | "Zaragoza";
type ProductStatus = "Active" | "Low stock" | "Out of stock" | "Discontinued";
```

**Reglas de Validación:**

- `sku` no debe estar vacío
- `weightKg` debe ser > 0 y <= 100
- Todas las dimensiones deben ser > 0 y <= 200
- `stockQuantity` debe ser >= 0
- `minStockThreshold` debe ser >= 0
- `unitCostUSD` debe ser > 0

### Envío (Shipment)

Representa un pedido de entrega que necesita ser enviado a un cliente.

**Interfaz: `Shipment`**

```typescript
interface Shipment {
  id: string;
  sku: string;
  quantity: number;
  origin: WarehouseLocation;
  destination: Destination;
  priority: ShipmentPriority;
  declaredValueUSD: number;
  carrier: string | null;
  status: ShipmentStatus;
  createdAt: Date;
}

interface Destination {
  city: string;
  country: Country;
  postalCode: string;
  distanceKm: number;
}

type Country = "United States" | "Spain";
type ShipmentPriority = "Standard" | "Express" | "Same-day";
type ShipmentStatus =
  | "Pending"
  | "Assigned"
  | "In transit"
  | "Delivered"
  | "Failed";
```

**Reglas de Validación:**

- `quantity` debe ser > 0
- `declaredValueUSD` debe ser > 0
- `distanceKm` debe ser >= 0

### Transportista (Carrier)

Representa un transportista de entregas con el que TrackFlow trabaja.

**Interfaz: `Carrier`**

```typescript
interface Carrier {
  id: string;
  name: string;
  operatesIn: Country[];
  baseRateUSD: number;
  ratePerKgUSD: number;
  ratePerKmUSD: number;
  avgDeliveryDays: number;
  onTimeRate: number;
  maxWeightKg: number;
  handlesFragile: boolean;
  acceptsPriority: ShipmentPriority[];
}
```

**Reglas de Validación:**

- `baseRateUSD`, `ratePerKgUSD`, `ratePerKmUSD` deben ser todos >= 0
- `avgDeliveryDays` debe ser > 0
- `onTimeRate` debe estar entre 0 y 100
- `maxWeightKg` debe ser > 0
- `operatesIn` debe contener al menos 1 país

### Movimiento de Inventario (InventoryMovement)

Rastrea cambios en el inventario (entrada o salida).

**Interfaz: `InventoryMovement`**

```typescript
interface InventoryMovement {
  id: string;
  sku: string;
  warehouse: WarehouseLocation;
  type: MovementType;
  quantity: number;
  reason: string;
  timestamp: Date;
}

type MovementType = "Inbound" | "Outbound" | "Transfer" | "Adjustment";
```

---

## Funciones Requeridas

### Operaciones de Colecciones (`src/utils/collections.ts`)

- `filterProductsByWarehouse(products: Product[], warehouse: WarehouseLocation): Product[]`
- `filterProductsByCategory(products: Product[], category: ProductCategory): Product[]`
- `filterLowStockProducts(products: Product[]): Product[]`
- `sortProductsByStock(products: Product[], order: "asc" | "desc"): Product[]`
- `sortCarriersByReliability(carriers: Carrier[], order: "asc" | "desc"): Carrier[]`

### Operaciones de Búsqueda (`src/utils/search.ts`)

- `findProductBySKU(products: Product[], sku: string): Product | null`
- `findShipmentById(shipments: Shipment[], id: string): Shipment | null`
- `binarySearchProductByWeight(sortedProducts: Product[], targetWeight: number): number`

### Scoring de Transportista y Cálculo de Costos (`src/utils/transformations.ts`)

- `calculateShippingCost(shipment: Shipment, product: Product, carrier: Carrier): number`
- `scoreCarrierForShipment(carrier: Carrier, shipment: Shipment, product: Product): number`
- `selectBestCarrier(carriers: Carrier[], shipment: Shipment, product: Product): { carrier: Carrier; score: number; cost: number } | null`

El costo incluye tarifa base, peso, distancia y recargo por prioridad: Standard 0%, Express 30% y Same-day 60%.

El puntaje incluye cobertura del país (20), peso (20), prioridad (15), fragilidad (15) y confiabilidad (30). `selectBestCarrier` descarta puntajes menores a 50 y elige el carrier adecuado de menor costo.

### Agregaciones y Reportes (`src/utils/transformations.ts`)

- `countProductsByCategory(products: Product[]): Record<ProductCategory, number>`
- `calculateTotalInventoryValue(products: Product[]): number`
- `calculateAverageShipmentDistance(shipments: Shipment[]): number`
- `groupShipmentsByStatus(shipments: Shipment[]): Record<ShipmentStatus, Shipment[]>`
- `findTopCarriers(shipments: Shipment[], topN: number): Array<{ carrier: string; count: number }>`

### Validaciones (`src/utils/validations.ts`)

- `validateProduct(product: Product): { valid: boolean; errors: string[] }`
- `validateShipment(shipment: Shipment): { valid: boolean; errors: string[] }`
- `validateCarrier(carrier: Carrier): { valid: boolean; errors: string[] }`

---

## Datos de Ejemplo

Los datos de ejemplo oficiales incluyen:

- Productos `SHOE-BLK-42`, `LAPTOP-DELL-15` y `PERFUME-COCO-50`.
- Carriers UPS, SEUR y DHL Express.
- Envío `SH-2024-8821` desde Zaragoza hacia Madrid.

La implementación debe usar objetos literales con estos datos para probar las funciones.

---

## Criterios de Aceptación

1. **Type Safety:** Todas las interfaces definidas correctamente con tipos apropiados.
2. **Corrección de Funciones:** Cada función produce el resultado esperado.
3. **Manejo de Casos Límite:** Arrays vacíos, valores nulos y datos inválidos no rompen la ejecución.
4. **Lógica de Validación:** Las reglas de negocio se aplican con precisión.
5. **Organización del Código:** Las funciones están en los archivos correctos según responsabilidad.
6. **Convenciones de Nombres:** Variables, funciones y tipos siguen las convenciones de TypeScript.
7. **Sin Mutaciones:** Las funciones de ordenamiento y filtrado no modifican los arrays originales.
8. **Funciones Puras:** Las funciones solo trabajan con parámetros, sin variables globales.

---

## Fuente oficial

Este contexto corresponde a la consigna oficial de TrackFlow para el Hito 2:

- https://github.com/4GeeksAcademy/ai-engineering-syllabus/blob/main/content/contexts/02-coding-fundamentals/CONTEXT-trackflow.es.md
