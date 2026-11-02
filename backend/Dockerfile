# =========================================================
# Dockerfile — Topshop Kosmetik AI Backend
# Base image: Python 3.11 slim
# =========================================================

FROM python:3.11-slim

# Metadata
LABEL maintainer="Topshop Kosmetik AI"
LABEL description="Backend FastAPI untuk Topshop Kosmetik AI"

# Set environment variable Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Set working directory
WORKDIR /app

# Install dependensi sistem
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Salin requirements terlebih dahulu untuk memanfaatkan Docker cache layer
COPY requirements.txt .

# Install dependensi Python
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Salin seluruh source code aplikasi
COPY . .

# Expose port aplikasi
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Perintah default untuk menjalankan aplikasi
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
