# Factorial Clocker - Docker Setup

## Quick Start

### Prerequisites
- Docker
- Docker Compose
- `.env.local` file with `USERNAME` and `PASSWORD`

### Running with Docker Compose

1. **Build and start the container:**
   ```bash
   docker-compose up -d
   ```

2. **Access the frontend:**
   - Open your browser and go to: `http://localhost:3000`

3. **View logs:**
   ```bash
   docker-compose logs -f
   ```

4. **Stop the container:**
   ```bash
   docker-compose down
   ```

## Docker Files

- **Dockerfile**: Builds the Node.js image (Alpine Linux based, lightweight)
- **docker-compose.yml**: Orchestrates the container with proper environment setup

## Environment Setup

The Docker container automatically loads credentials from `.env.local`:
```
USERNAME=your-factorial-email@example.com
PASSWORD=your-factorial-password
```

Make sure `.env.local` exists in the project root before running Docker.

## Features

- **Auto-restart**: Container restarts automatically if it crashes
- **Health checks**: Docker monitors container health every 30 seconds
- **Volume mounts**: Code changes are reflected immediately (development mode)
- **Network isolation**: Secure network for container communication
- **Port mapping**: Server runs on port 3000, accessible at `http://localhost:3000`

## Troubleshooting

**Container won't start:**
```bash
docker-compose logs
```

**Permission denied:**
On macOS/Linux, you may need `sudo`:
```bash
sudo docker-compose up -d
```

**Port 3000 already in use:**
Change the port in `docker-compose.yml`:
```yaml
ports:
  - "8080:3000"  # Access at localhost:8080
```

**Build issues:**
```bash
docker-compose build --no-cache
```
