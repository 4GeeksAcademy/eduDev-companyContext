# `uis` folder

This folder contains **all the user interfaces** related to the company for the cross-functional AI Engineering project (for example: web applications, internal dashboards, customer portals, Streamlit/Gradio apps, etc.).

Each subfolder inside `uis/` must correspond to **one specific user interface** (for example: `website`, `backoffice`) and include its own technical and functional documentation.

- **Main purpose**: to centralize in a single place all the frontend applications that support the company's use cases.
- **Recommendation**: document in this file (or in sub-READMEs) the applications you add, their objective, the technology used, and how to run them.

> _Spanish version: [README.es.md](./README.es.md)._

## Available Interfaces

| Folder | Purpose | Local URL after `npm run serve` from the repository root |
| --- | --- | --- |
| `website/` | Hito 4 public corporate website | `http://localhost:3000/uis/website/` |
| `backoffice/` | Hito 4 static operations snapshot | `http://localhost:3000/uis/backoffice/` |
| `talent-pipeline-tracker/` | Hito 3 talent pipeline frontend | See its local README |
