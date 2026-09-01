# TrackFlow Incident Analyzer API

This minimal FastAPI service validates uploaded incident CSV files with the same
standard-library analysis module used by the CLI. It never persists source files
and stores only the last successful aggregate summary in process memory. Restarting
the API clears that result.

## Run locally

From the repository root:

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r services/api/requirements.txt
uvicorn services.api.app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API documentation is available at `http://localhost:8000/docs`.

To allow another static UI origin, set a comma-separated explicit allowlist:

```bash
TRACKFLOW_CORS_ORIGINS="http://localhost:3000,http://your-tailnet-host:3000" \
  uvicorn services.api.app.main:app --host 0.0.0.0 --port 8000
```

## Endpoints

- `POST /api/incidents/analyze` accepts one UTF-8 `.csv` upload.
- `GET /api/incidents/results/export` downloads aggregate metrics as `results.csv`.

## Tests

After installing the requirements, run:

```bash
python3 -m unittest discover -s services/api/tests -v
```
