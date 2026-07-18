# TrackFlow — Proyecto de Ingeniería de IA

[![4Geeks Academy](https://img.shields.io/badge/4Geeks-Academy-blue)](https://4geeksacademy.com)
[![AI Engineering](https://img.shields.io/badge/track-AI%20Engineering-green)](https://4geeksacademy.com/es/programas-de-carrera/ingenieria-ia)

_Proyecto transversal del Programa de Carrera en Ingeniería de IA de 4Geeks Academy._

_Las instrucciones están [disponibles en inglés](./README.md)._

---

## Propósito

Este repositorio contiene los entregables de TrackFlow para los primeros hitos del curso:

- **Hito 1:** sitio web público y formulario B2B.
- **Hito 2:** utilidades TypeScript para inventario, envíos y transportistas.

---

## Estado actual

El proyecto incluye el frontend estático de TrackFlow y la lógica de negocio del Hito 2 conectada a un centro de operaciones.

- `CONTEXT.md` contiene el contexto activo del Hito 2.
- `CONTEXT-hito-1.md` conserva el contexto anterior.
- `package.json` incluye comandos para validar, compilar, ejecutar la demo y servir el frontend.
- `operations.html` permite probar las funciones TypeScript desde el navegador.

## Funcionalidades del Hito 2

- Interfaces tipadas para productos, envíos, transportistas y movimientos de inventario.
- Filtros, ordenamientos, búsqueda lineal y búsqueda binaria.
- Cálculo de costos, puntuación y selección de transportistas.
- Reportes agregados de inventario y envíos.
- Validaciones de negocio con listas de errores.
- Demo ejecutable con comprobaciones de casos normales y casos límite.

---

## Estructura del repositorio

```text
├── index.html
├── application.html
├── operations.html
├── validation.js
├── src/
│   ├── data/sampleData.ts
│   ├── types/models.ts
│   ├── utils/collections.ts
│   ├── utils/search.ts
│   ├── utils/transformations.ts
│   ├── utils/validations.ts
│   ├── demo.ts
│   └── operations.ts
├── package.json
└── tsconfig.json
```

---

## Instalación y validación

Instala las dependencias:

```bash
npm install
```

Valida y ejecuta las utilidades TypeScript:

```bash
npm run typecheck
npm run build
npm run demo
```

Sirve el frontend:

```bash
npm run serve
```

Luego abre:

- Landing: `http://localhost:3000/index.html`
- Formulario B2B: `http://localhost:3000/application.html`
- Centro de operaciones: `http://localhost:3000/operations.html`

---

## Hitos (referencia)

| Hito | Enfoque       | Entregables típicos                              |
| ---- | ------------- | ------------------------------------------------ |
| 0    | Prework       | Configuración del entorno, primeros prompts      |
| 1    | Web           | Sitio corporativo, formularios, SEO              |
| 2    | Programación  | Lógica de negocio, puntuación, cálculos          |
| 3    | UI con IA     | Interfaces generadas con IA                      |
| 4    | Next.js       | Portales, app de fidelización, UI de operaciones |
| 5    | Backend       | API central (ubicaciones, menús, ventas, etc.)   |
| 6    | Telemetría    | Pipeline de datos, dashboards                    |
| 7    | RAG y memoria | Base de conocimiento semántica, búsqueda         |
| 8    | Agentes       | Agentes de soporte, onboarding, formación        |
| 9    | Workflows     | Automatizaciones con n8n                         |
| 10   | Tiempo real   | Dashboards en vivo, alertas, streaming           |

---

## Enlaces

- [4Geeks Academy — Ingeniería de IA](https://4geeksacademy.com/es/programas-de-carrera/ingenieria-ia)
- [Cómo empezar un proyecto de código](https://4geeks.com/lesson/how-to-start-a-project)

---

## Contribuidores

Esta plantilla fue creada como parte del Programa de Carrera de Ingeniería de IA de 4Geeks Academy por [@marcogonzalo](https://www.linkedin.com/in/marcogonzalo) y [@alezanchezr](https://x.com/alesanchezr), junto a otros muchos colaboradores. Descubre más sobre nuestro [Curso de Ingeniería de IA](https://4geeksacademy.com/es/programas-de-carrera/ingenieria-ia) y sobre [otros cursos](https://4geeksacademy.com/es/comparar-programas).

Puedes encontrar otras plantillas y recursos similares en la [página de GitHub de 4Geeks Academy](https://github.com/4geeksacademy).

_Esta plantilla la mantiene 4Geeks Academy para el track de Ingeniería de IA. Uso exclusivo del programa._
