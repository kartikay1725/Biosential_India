FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    git-lfs \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency definition and install
COPY requirements-api.txt .
RUN pip install --no-cache-dir -r requirements-api.txt

# Copy required backend assets
COPY src/ /app/src/
COPY lib/data/ /app/lib/data/
COPY models/ /app/models/
COPY data/ /app/data/

# Hugging Face Spaces uses port 7860 by default; Render/Railway pass $PORT dynamically
ENV PORT=7860
EXPOSE 7860

CMD ["python", "src/api/server.py"]

