FROM python:3.11-slim

WORKDIR /app

# Copy dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Expose port for the FastAPI server
EXPOSE 8000

# Command to run the webhook API
CMD ["uvicorn", "api.webhook_server:app", "--host", "0.0.0.0", "--port", "8000"]
