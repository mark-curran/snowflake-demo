FROM python:3.13-slim AS base

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ src/

# TODO: Create a develop build stage with the tests.

FROM base AS production

RUN useradd app && chown -R app:app /app
USER app

# Relative to the /app folder inside the container.
ENTRYPOINT ["python", "src/main.py"]
