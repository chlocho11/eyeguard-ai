FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

ENV PYTHONUNBUFFERED=1
ENV PORT=8080

# Cloud Run listens on PORT (8080 by default)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]