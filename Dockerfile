# Stage 1: Build the React frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/client

# Copy package files and install dependencies
COPY client/package*.json ./
RUN npm install

# Copy all frontend source files and build
COPY client/ ./
RUN npm run build

# Stage 2: Build the Python backend and serve everything
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies (required for OpenCV and yt-dlp/ffmpeg)
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend source code
COPY . .

# Copy the built frontend static files from Stage 1 into the expected location
COPY --from=frontend-build /app/client/dist /app/client/dist

# Set the port environment variable for Google Cloud Run (defaults to 8080)
ENV BACKEND_PORT=8080
EXPOSE 8080

# Start the unified FastAPI + Socket.IO server using uvicorn
CMD ["uvicorn", "server:combined_app", "--host", "0.0.0.0", "--port", "8080"]
