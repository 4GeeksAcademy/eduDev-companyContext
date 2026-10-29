# syntax=docker/dockerfile:1
FROM python:3.11-slim
WORKDIR /app
RUN pip install --no-cache-dir uv && uv venv /opt/venv
ENV VIRTUAL_ENV=/opt/venv
ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONDONTWRITEBYTECODE=1
COPY api/requirements.txt /app/requirements.txt
RUN uv pip install --no-cache -r requirements.txt
COPY . /app/services
# Named contexts contain other artifacts; copy only runtime Python modules.
COPY --from=shared __init__.py incident_analysis.py /app/shared/
COPY --from=packages_shared incidents.py incident_validation.py /app/packages/shared/
EXPOSE 8000
CMD ["uvicorn", "services.api.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
