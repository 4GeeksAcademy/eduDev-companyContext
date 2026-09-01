# `scripts` folder

This folder contains **helper scripts** for the monorepo: development automation, maintenance utilities, repetitive tasks (setup, lint, migrations, data generation, etc.), and internal tooling.

- **Main purpose**: group support tools that do not belong to a specific app, agent, or pipeline but make the team’s work easier.
- **Recommendation**: document each script (what it does, parameters, requirements, usage examples) and keep them reproducible (and safe) across environments.

## Incident analyzer

`analyze.py` validates a UTF-8 TrackFlow incident CSV and prints aggregate metrics
without exposing source records or customer email addresses. Run it from either the
repository root or this folder:

```bash
# Repository root
python3 scripts/analyze.py scripts/incidents-trackflow.csv

# scripts/
python3 analyze.py incidents-trackflow.csv
```

Choose `y` at the final prompt to create aggregate-only `results.csv` in the current
working directory. Choose `n` to exit without creating an export.

> _Spanish version: [README.es.md](./README.es.md)._
