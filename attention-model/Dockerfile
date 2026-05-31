FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir \
    --extra-index-url https://download.pytorch.org/whl/cpu \
    -r requirements.txt

COPY src/ ./src/

ENV PYTHONPATH=/app/src

# Запускает оба сервера: gRPC ($GRPC_PORT, для attention-service) и HTTP/WS ($HTTP_PORT)
CMD ["python", "-m", "api.main"]
