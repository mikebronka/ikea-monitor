FROM python:3.12-slim AS base

WORKDIR /code
RUN pip install --no-cache-dir --upgrade pip

COPY pyproject.toml .
RUN pip install --no-cache-dir .

FROM base AS production

COPY app/ /code/app/
COPY alembic/ /code/alembic/
COPY alembic.ini /code/

RUN useradd -m appuser
USER appuser

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
