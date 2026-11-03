# Seeded middleware timing evidence

The [retained samples](caching-middleware.json) came from one local run on
2026-11-03, application source `79c4271`: exit 0 in 7 seconds.
They capture actual `trackflow.timing` LogRecord duration arguments, rounded to
six decimals; the normal formatted log rounds to three. These are final-code
cold/warm measurements, **not an uncached implementation baseline**.

Both synthetic datasets (50 and 1,000 varied incidents) and all three stores
were created by the existing `scripts.profile_caching.synthetic_client` fixture.
Each endpoint received one cold and seven identical warm requests. All 32 reads
returned 200 with matching public bodies; every case made one cold storage scan
and zero warm scans. Both temporary store directories were removed afterward.
The existing Starlette/httpx deprecation warning was non-failing. No application
source, dependencies, running services, real data, browser or Pi restart changed.

## Reproduce from the repository root

Use the existing uv environment. The private temporary root must exist; on a new
checkout create it with `mkdir -m 700 .git/pi-tmp`. No global settings are needed.
The command obtains the current commit for a new run; the retained original
artifact remains pinned to its actual source above. Do not compare TestClient
wall-time samples with these middleware-only durations as if they were the same
metric. The first read is a single sample; only warm results are medians.

```bash
env -i PATH="$PATH" HOME="$HOME" TMPDIR="$PWD/.git/pi-tmp" \
  SOURCE_COMMIT="$(git rev-parse HEAD)" UV_NO_ENV_FILE=1 UV_NO_SYNC=1 \
  UV_OFFLINE=1 PYTHONDONTWRITEBYTECODE=1 uv run --offline --no-sync python -B - <<'PY'
import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from statistics import median
from unittest.mock import patch
from scripts.profile_caching import synthetic_client

records = []
class Capture(logging.Handler):
    def emit(self, record):
        method, path, status, milliseconds = record.args
        if method == 'GET' and path in ('/api/incidents', '/api/incidents/summary'):
            records.append((method, path, status, float(milliseconds)))

logger = logging.getLogger('trackflow.timing')
handler = Capture()
old_level, old_propagate = logger.level, logger.propagate
logger.setLevel(logging.INFO)
logger.propagate = False
logger.addHandler(handler)
results, owned_dirs = [], []
try:
    for rows in (50, 1000):
        with synthetic_client(rows) as client:
            from services.api.app.routers import incident_management as routes
            owned_dirs.append(Path(os.environ['TRACKFLOW_INCIDENTS_DB_PATH']).parent)
            for url in ('/api/incidents?status=open&branch=central', '/api/incidents/summary'):
                route = url.split('?')[0]
                records.clear()
                with patch.object(routes, 'list_incidents', wraps=routes.list_incidents) as scan:
                    response = client.get(url)
                    assert response.status_code == 200
                    expected = response.json()
                    cold_scans = scan.call_count
                    for _ in range(7):
                        repeated = client.get(url)
                        assert repeated.status_code == 200 and repeated.json() == expected
                    warm_scans = scan.call_count - cold_scans
                assert len(records) == 8
                assert all((m, p, s) == ('GET', route, 200) for m, p, s, _ in records)
                assert cold_scans == 1 and warm_scans == 0
                durations = [round(r[3], 6) for r in records]
                assert all(value >= 0 for value in durations)
                results.append(dict(rows=rows, method='GET', url=url, status=200,
                                    cold_ms=durations[0], warm_ms=durations[1:],
                                    warm_median_ms=round(median(durations[1:]), 6),
                                    cold_scans=cold_scans, warm_scans=warm_scans,
                                    identical_public_bodies=True))
        assert not owned_dirs[-1].exists()
finally:
    logger.removeHandler(handler)
    logger.setLevel(old_level)
    logger.propagate = old_propagate
assert all(not path.exists() for path in owned_dirs)
print(json.dumps(dict(measured_at=datetime.now(timezone.utc).isoformat(),
                     source_commit=os.environ['SOURCE_COMMIT'],
                     timing_source='trackflow.timing LogRecord.args[3] (milliseconds)',
                     precision_decimals=6, formatted_log_precision_decimals=3,
                     comparison='Final cached code: small/large seeded datasets and cold/warm reads; not a pre-implementation baseline',
                     synthetic_stores_cleaned=True, middleware_get_records=32,
                     results=results), indent=2))
PY
```

This is a single bounded synthetic comparison, not production traffic, a load
test or an expiry-duration study. Existing functional tests remain separate
evidence. No secrets, response bodies or customer identifiers are retained.
