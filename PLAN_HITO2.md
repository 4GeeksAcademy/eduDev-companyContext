# Plan de implementación del Hito 2

Este documento guía la implementación progresiva del Hito 2 de TrackFlow. El objetivo es cumplir el 100% de la consigna de 4Geeks Academy con una solución académica simple basada en TypeScript, funciones puras, arrays, objetos y DOM nativo, conectada al frontend existente.

## Ruta de trabajo

1. Completar las fases en orden.
2. Validar cada fase antes de comenzar la siguiente.
3. Comparar el resultado final con el README oficial y el contexto de TrackFlow.
4. Entregar todo desde la rama `hito-2-fundamentos-programacion` mediante un Pull Request hacia `main`.

## Alcance

- Mantener `index.html`, `application.html` y `validation.js` del Hito 1.
- Respetar el diseño actual basado en Tailwind CSS CDN.
- Implementar la lógica de negocio en TypeScript.
- Conectar las funciones a una página operativa sencilla.
- Evitar React, APIs, bases de datos, frameworks y arquitecturas que la consigna no requiere.
- Mantener las funciones puras, tipadas y separadas por responsabilidad.

## Estructura objetivo

```text
src/
├── data/
│   └── sampleData.ts
├── types/
│   └── models.ts
├── utils/
│   ├── collections.ts
│   ├── search.ts
│   ├── transformations.ts
│   └── validations.ts
├── operations.ts
└── demo.ts

dist/                   # JavaScript generado por TypeScript
operations.html         # Interfaz de operaciones
package.json
tsconfig.json
CONTEXT.md              # Contexto oficial del Hito 2
CONTEXT-hito-1.md        # Contexto anterior preservado
```

## Fase 1: Preparación

**Objetivo:** dejar una base mínima, ejecutable y alineada con la consigna.

- [x] Crear la rama `hito-2-fundamentos-programacion`.
- [x] Preservar el contexto anterior como `CONTEXT-hito-1.md`.
- [x] Incorporar el contexto oficial de TrackFlow Hito 2 en `CONTEXT.md`.
- [x] Crear un `package.json` raíz con TypeScript como dependencia de desarrollo.
- [x] Configurar `tsconfig.json` con tipado estricto y salida hacia `dist/`.
- [x] Documentar los comandos `typecheck`, `build`, `demo` y `serve`.
- [x] Confirmar que el frontend del Hito 1 continúa funcionando.

Comandos esperados:

```bash
npm run typecheck
npm run build
npm run demo
npm run serve
```

## Fase 2: Modelado y datos

**Objetivo:** representar exactamente el dominio definido por TrackFlow.

En `src/types/models.ts`:

- [x] Definir `Product`, `Dimensions`, `Shipment`, `Destination`, `Carrier` e `InventoryMovement`.
- [x] Definir todos los tipos unión requeridos por el contexto.
- [x] Usar los nombres y valores exactos del contexto oficial.
- [x] Tipar explícitamente todas las propiedades.
- [x] Evitar el uso de `any`.

En `src/data/sampleData.ts`:

- [x] Incorporar los productos, carriers y envío proporcionados por la consigna.
- [x] Añadir envíos adicionales y un movimiento de inventario sencillos para probar reportes.
- [x] Representar los datos mediante objetos literales correctamente tipados.

**Validación:** TypeScript debe aceptar todos los datos válidos y detectar propiedades o valores incorrectos.

## Fase 3: Colecciones y búsquedas

**Objetivo:** implementar las operaciones fundamentales sobre arrays.

En `src/utils/collections.ts`:

- [x] `filterProductsByWarehouse`
- [x] `filterProductsByCategory`
- [x] `filterLowStockProducts`
- [x] `sortProductsByStock`
- [x] `sortCarriersByReliability`

En `src/utils/search.ts`:

- [x] `findProductBySKU`
- [x] `findShipmentById`
- [x] `binarySearchProductByWeight`

Criterios de aceptación:

- [x] Los parámetros y retornos tienen tipos explícitos.
- [x] Los filtros y ordenamientos no mutan los arrays recibidos.
- [x] La búsqueda de SKU ignora diferencias entre mayúsculas y minúsculas.
- [x] La búsqueda binaria está implementada manualmente.
- [x] Los resultados no encontrados devuelven `null` o `-1`, según la consigna.
- [x] Los arrays vacíos se manejan sin errores.

## Fase 4: Costos y selección de carriers

**Objetivo:** implementar el núcleo operativo de TrackFlow.

En `src/utils/transformations.ts`:

- [x] `calculateShippingCost`
- [x] `scoreCarrierForShipment`
- [x] `selectBestCarrier`

Reglas que deben cumplirse:

- [x] Calcular tarifa base, peso, distancia y recargo por prioridad.
- [x] Aplicar recargos de 0%, 30% y 60%.
- [x] Puntuar país, peso, prioridad, fragilidad y confiabilidad.
- [x] Descartar carriers con puntuación menor a 50.
- [x] Elegir el carrier adecuado con menor costo.
- [x] Redondear costos y puntuaciones a dos decimales.
- [x] Devolver `null` cuando ningún carrier sea adecuado.

## Fase 5: Reportes y agregaciones

**Objetivo:** implementar todos los reportes exigidos.

En `src/utils/transformations.ts`:

- [x] `countProductsByCategory`
- [x] `calculateTotalInventoryValue`
- [x] `calculateAverageShipmentDistance`
- [x] `groupShipmentsByStatus`
- [x] `findTopCarriers`

Casos límite acordados:

- [x] Las categorías sin productos tienen conteo `0`.
- [x] Un inventario vacío tiene valor total `0`.
- [x] Una colección de envíos vacía tiene promedio `0`.
- [x] Los estados sin envíos contienen arrays vacíos.
- [x] Un `topN` inválido o una colección vacía devuelve un array vacío.
- [x] Los envíos cuyo carrier sea `null` se ignoran en el ranking.

## Fase 6: Validaciones de negocio

**Objetivo:** impedir que se procesen datos inválidos.

En `src/utils/validations.ts`:

- [x] `validateProduct`
- [x] `validateShipment`
- [x] `validateCarrier`

Resultado esperado:

```typescript
interface ValidationResult {
  valid: boolean;
  errors: string[];
}
```

Criterios de aceptación:

- [x] Evaluar todas las reglas sin detenerse en el primer error.
- [x] Devolver `errors: []` para objetos válidos.
- [x] Cubrir los límites de peso, dimensiones, stock, costos, distancia, confiabilidad y países.
- [x] Mantener cada validador como una función pura.
- [x] Probar objetos válidos, inválidos y valores en los límites permitidos.

## Fase 7: Demo ejecutable

**Objetivo:** comprobar las funciones sin añadir un framework de testing innecesario.

En `src/demo.ts`:

- [x] Ejecutar todas las funciones con los datos de ejemplo.
- [x] Mostrar resultados descriptivos en consola.
- [x] Añadir comprobaciones simples de resultados y casos límite.
- [x] Evitar Jest, Vitest u otras dependencias no requeridas.

Validación de la fase:

```bash
npm run typecheck
npm run demo
```

## Fase 8: Integración con el frontend

**Objetivo:** conectar la lógica TypeScript con una interfaz que conserve el diseño actual.

En `operations.html`:

- [x] Reutilizar Tailwind CDN, colores, tipografía, tarjetas y navegación existentes.
- [x] Añadir un enlace para regresar a la landing.
- [x] Mantener un diseño responsive y accesible.
- [x] Evitar lógica de negocio duplicada dentro del HTML.

En `src/operations.ts`:

- [x] Importar datos y funciones desde los módulos TypeScript.
- [x] Escuchar los eventos del DOM.
- [x] Ejecutar las operaciones y renderizar sus resultados.
- [x] Mantener la presentación separada de los cálculos.

La interfaz tendrá tres bloques:

1. Inventario: filtros, ordenamientos y búsquedas.
2. Carriers: costo, puntuación y selección del mejor carrier.
3. Reportes: métricas agregadas y resultados de validación.

Controles mínimos:

- [x] Selectores de almacén, categoría y orden.
- [x] Campo para buscar por SKU.
- [x] Campo para buscar por peso mediante búsqueda binaria.
- [x] Selectores de carrier y envío.
- [x] Botones para generar reportes.
- [x] Paneles con mensajes claros para resultados vacíos o no encontrados.
- [x] Enlace discreto desde la landing hacia la demo operativa.

## Fase 9: Auditoría de cumplimiento

**Objetivo:** verificar el 100% del README oficial y del contexto TrackFlow.

- [x] Están modeladas las cuatro entidades principales y todos sus campos.
- [x] Están implementadas las cinco funciones de colecciones.
- [x] Están implementadas las tres funciones de búsqueda.
- [x] Están implementadas las tres funciones de costos y carriers.
- [x] Están implementadas las cinco funciones de reportes.
- [x] Están implementados los tres validadores.
- [x] Todos los parámetros y retornos tienen tipos explícitos.
- [x] No se usa `any`.
- [x] Las funciones son puras y tienen una sola responsabilidad.
- [x] Los ordenamientos y filtros no mutan los datos originales.
- [x] Se manejan arrays vacíos, valores nulos y elementos no encontrados.
- [x] TypeScript compila sin errores.
- [x] Los comandos de desarrollo están documentados.
- [x] El frontend ejecuta la lógica TypeScript compilada.
- [x] Se respetan camelCase, PascalCase y el uso de `const` por defecto.
- [x] El README explica instalación, ejecución, estructura y funcionalidades.

Comandos finales:

```bash
npm install
npm run typecheck
npm run build
npm run demo
npm run serve
```

## Fase 10: Entrega

- [x] Revisar que solo estén incluidos los archivos del Hito 2.
- [x] Crear commits descriptivos y pequeños por fase.
- [ ] Subir la rama `hito-2-fundamentos-programacion`.
- [ ] Abrir un Pull Request hacia `main`.
- [ ] Documentar funcionalidades, dificultades y soluciones en el PR.
- [ ] Incluir capturas de `operations.html`.
- [ ] Entregar el enlace del Pull Request en 4Geeks.

## Referencias oficiales

- [Consigna del Hito 2](https://github.com/4GeeksAcademy/ai-engineering-syllabus/blob/main/content/projects/ai-eng-milestone-coding-fundamentals/README.es.md)
- [Contexto de TrackFlow para el Hito 2](https://github.com/4GeeksAcademy/ai-engineering-syllabus/blob/main/content/contexts/02-coding-fundamentals/CONTEXT-trackflow.es.md)
