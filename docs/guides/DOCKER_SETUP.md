# Docker Setup Guide for iAyos Platform

This guide explains how to run the iAyos platform using Docker on Windows, macOS, and Linux.

## Prerequisites

### All Platforms

- Docker Desktop (latest version)
- Docker Compose (included with Docker Desktop)
- At least 4GB of RAM allocated to Docker
- At least 20GB of free disk space

### Installation Links

- **Windows**: https://docs.docker.com/desktop/install/windows-install/
- **macOS**: https://docs.docker.com/desktop/install/mac-install/
- **Linux**: https://docs.docker.com/desktop/install/linux-install/

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Banyel3/iayos.git
cd iayos
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.docker.example .env

# Edit .env with your actual values
# Windows: notepad .env
# macOS/Linux: nano .env
```

### 3. Build and Start Services

```bash
# Build all containers (first time only)
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin
- **WebSocket**: ws://localhost:8001

## Development Mode

For active development with hot reload:

```bash
# Use development docker-compose
docker-compose -f docker-compose.dev.yml up
```

## Common Commands

### Service Management

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart a specific service
docker-compose restart backend

# View logs
docker-compose logs -f backend frontend

# Check service status
docker-compose ps
```

### Database Operations

```bash
# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Access PostgreSQL shell
docker-compose exec postgres psql -U iayos_user -d iayos_db

# Backup database
docker-compose exec postgres pg_dump -U iayos_user iayos_db > backup.sql

# Restore database
docker-compose exec -T postgres psql -U iayos_user iayos_db < backup.sql
```

### Container Shell Access

```bash
# Access backend container
docker-compose exec backend sh

# Access frontend container
docker-compose exec frontend sh

# Access database container
docker-compose exec postgres sh
```

### Cleanup

```bash
# Remove containers and networks (keeps volumes)
docker-compose down

# Remove containers, networks, and volumes (WARNING: deletes data!)
docker-compose down -v

# Remove all unused Docker objects
docker system prune -a
```

## Platform-Specific Notes

### Windows

1. **Enable WSL 2**:
   - Docker Desktop on Windows requires WSL 2
   - Follow: https://docs.microsoft.com/en-us/windows/wsl/install

2. **File Sharing**:
   - Ensure your project folder is in a WSL 2 location for better performance
   - Or enable file sharing in Docker Desktop settings

3. **Line Endings**:
   - Git may convert line endings. Configure Git:
     ```bash
     git config --global core.autocrlf input
     ```

### macOS

1. **Apple Silicon (M1/M2/M3)**:
   - Docker Desktop automatically handles ARM architecture
   - Images will build for ARM64 (faster performance)

2. **Resource Allocation**:
   - Go to Docker Desktop → Settings → Resources
   - Allocate at least 4GB RAM, 4 CPUs

### Linux

1. **Post-Installation**:

   ```bash
   # Add user to docker group
   sudo usermod -aG docker $USER

   # Log out and back in for changes to take effect
   ```

2. **Docker Compose**:
   - Ensure docker-compose is installed separately on some distributions

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
# Windows (PowerShell)
netstat -ano | findstr :3000

# macOS/Linux
lsof -i :3000

# Kill the process or change port in docker-compose.yml
```

### Container Won't Start

```bash
# Check logs
docker-compose logs backend

# Rebuild container
docker-compose build --no-cache backend
docker-compose up -d backend
```

### Permission Issues (Linux)

```bash
# Fix ownership of project files
sudo chown -R $USER:$USER .

# Or run docker as root (not recommended)
sudo docker-compose up
```

### Database Connection Issues

```bash
# Ensure PostgreSQL is healthy
docker-compose ps postgres

# Check connection
docker-compose exec backend python manage.py dbshell
```

### Out of Disk Space

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Complete cleanup
docker system prune -a --volumes
```

## Production Deployment

### Security Checklist

- [ ] Change all default passwords
- [ ] Set `DEBUG=False` in .env
- [ ] Use strong `DJANGO_SECRET_KEY`
- [ ] Configure proper `ALLOWED_HOSTS`
- [ ] Enable HTTPS with SSL certificates
- [ ] Set up proper backup strategy
- [ ] Configure firewall rules
- [ ] Use environment-specific .env files

### Nginx Configuration

The docker-compose includes Nginx for production. Configure SSL:

```bash
# Place SSL certificates in ./ssl/
mkdir ssl
cp your-cert.crt ssl/
cp your-cert.key ssl/
```

### Scaling Services

```bash
# Scale backend workers
docker-compose up -d --scale backend=3

# Scale channels workers
docker-compose up -d --scale channels=2
```

## Monitoring

### View Resource Usage

```bash
# Real-time stats
docker stats

# Container inspection
docker-compose exec backend top
```

### Health Checks

```bash
# Check all service health
docker-compose ps

# Test backend
curl http://localhost:8000/api/health

# Test frontend
curl http://localhost:3000
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
- [Django Docker Best Practices](https://docs.docker.com/samples/django/)

## Support

For issues specific to this project, please create an issue on GitHub:
https://github.com/Banyel3/iayos/issues
