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
Read, parse and export failures print fixed actionable messages to stderr and exit
nonzero; submitted headers and internal I/O paths are not echoed.

## Historical incident manager seed

Run explicitly from the repository root with the existing uv environment:

```bash
uv run --no-sync python scripts/seed_incidents.py scripts/incidents-trackflow.csv
```

This writes `services/api/data/incidents.json`, not the analyzer aggregate or
supplier/user databases. Set `TRACKFLOW_INCIDENTS_DB_PATH` to an isolated path for
tests or experiments. Never run experiments against the ordinary database.
No incident seed runs at API startup. Stop the API before running this separate
CLI process: TinyDB supports only one process accessing this store.

- Official source: 95 valid inserts, 5 invalid rows; rerun inserts 0, existing 95.
- Output contains only aggregate counts and invalid physical CSV line numbers
  (the ending line for multiline records) with safe reason codes. Invalid rows
  are skipped; structural/I/O errors exit nonzero before inserting. Storage
  failures (file I/O and invalid storage JSON) are counted separately and exit
  nonzero; partial successes survive. Programmer defects propagate rather than
  being mislabeled as storage failures.
- UUID5 uses fixed namespace `a38f716a-d93e-5a2b-9dc9-d81d3b3d6139` and the trimmed,
  validated `incident_id`. Different IDs remain distinct even with equal titles
  and dates. Existing records, including changed statuses/timestamps, never overwrite.
- Seed-only fallback: an absent `incident_id` column or blank/whitespace ID uses
  UUID5 in the same namespace over compact ASCII JSON
  `["title+created_at", transformed_title, utc_timestamp]`. The timestamp is UTC
  midnight in ISO format with `+00:00`; JSON separators are `,` and `:` without
  spaces. The tagged array is unambiguous and cannot overlap a valid legacy ID.
  Equal transformed title/date keys intentionally deduplicate; changing either
  changes identity. Valid source IDs retain the original UUID5 names unchanged.
- The seed explicitly opts into shared missing-ID validation. Nonempty malformed
  IDs and all other invalid fields remain rejected. Analyzer validation stays
  strict by default, including required ID column and nonblank valid IDs.
- Titles use the first 120 raw description characters, then trim; empty titles
  are invalid. Descriptions remain literal, dates become UTC midnight, and both
  initial timestamps match. Only manager fields persist; source customer email,
  customer type, tracking number, carrier, satisfaction score and legacy ID do not.

Focused isolated verification:

```bash
uv run --no-sync python -m unittest discover -s services/api/tests -p 'test_incident_seed.py' -v
```

## Synthetic cache profile

`profile_caching.py` measures authenticated incident list/summary HTTP requests
through in-process TestClient, not a production server. It always creates disposable
users/suppliers/incidents stores, overrides SQL/mail configuration and uses a
synthetic signing secret. It never reads dotenv files or accepts a production
store path. Temporary stores and clients close even on failure; outbound mail
transport is blocked. No installation, network service or deployment is required.

From the repository root with the existing uv environment:

```bash
unset UV_ENV_FILE
export UV_NO_ENV_FILE=1 UV_NO_SYNC=1 UV_OFFLINE=1 PYTHONDONTWRITEBYTECODE=1
uv run --no-sync python scripts/profile_caching.py --help
uv run --no-sync python scripts/profile_caching.py --rows 50 1000 --repeats 7
```

`--rows` accepts up to four counts from 1 to 2000; `--repeats` accepts 3–20.
Each size gets a new store. The existing idempotent insertion helper creates
validated, distinct synthetic titles/descriptions, dates, UUIDs and all manager
enum variants. Seeding and real registration/login are outside measured time.
There are no foreign keys in incident records and no artificial sleeps.

Each JSON output line reports row count, endpoint, first-request milliseconds,
median of subsequent requests, repeat count and observed full-store scan counts.
The list uses `status=open&branch=central`; summary covers all rows. Expected cache
behavior is one cold scan and zero warm scans. Every repeat must return the same
successful public body or the script fails. There is no production debug endpoint.
Compare the exact command before and after a change; first-request timings are
single samples, not medians. HTTP timings include authentication, response
validation/serialization and TestClient overhead. They do not measure production
network latency, sustained load, multi-worker behavior or real call frequency.

> _Spanish version: [README.es.md](./README.es.md)._
