# `shared` folder

This folder is reserved for **unbundled shared resources** in the monorepo: templates, schemas, common assets, short technical documentation, or configuration shared across several components.

- **Main purpose**: provide a neutral place for reusable items that do not fit as an application (`apps/`) or as a package/library (`packages/`).
- **Recommendation**: document what each subfolder or file contains and link to it from consuming components to keep traceability.

`incident_analysis.py` is the canonical pure-Python validation, aggregation, and
CSV-export module for TrackFlow incident files. Both `scripts/analyze.py` and the
incident API import it so business rules remain identical across interfaces.

> _Spanish version: [README.es.md](./README.es.md)._
