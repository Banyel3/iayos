# iAyos Build & Deployment Guide

## Prerequisites

### Local Development
- Docker & Docker Compose
- Node.js 18+ (for frontend development)
- Python 3.11+ (for backend development)
- Flutter SDK (for mobile development)

### Cloud Build Requirements
- Docker Buildx with cloud driver
- Access to build cloud: `banyel/iayo-docker`

## Environment Setup

### 1. Environment Variables
Copy and configure environment variables:
```bash
# Copy example environment file
cp .env.docker.example .env.docker

# Required variables for local build:
DATABASE_URL=postgresql://user:pass@localhost:5432/iayos_db
DJANGO_SECRET_KEY=your-secret-key-here
XENDIT_API_KEY=your-xendit-api-key
NEXT_PUBLIC_API_URL=http://localhost:8000
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 2. Database Setup
The system uses PostgreSQL with the following connection:
- **Production**: Neon PostgreSQL (as configured in .env.docker.example)
- **Development**: Local PostgreSQL via Docker Compose

## Build Configurations

### Local Development Build

#### Backend (Django)
```bash
# Development with hot reload
docker-compose -f docker-compose.dev.yml up backend

# Or run locally:
cd apps/backend
pip install -r requirements.txt
python src/manage.py runserver
```

#### Frontend Web (Next.js)
```bash
# Development with hot reload
cd apps/frontend_web
npm install
npm run dev

# Or via Docker:
docker-compose -f docker-compose.dev.yml up frontend
```

#### Mobile App (Flutter)
```bash
cd apps/frontend_mobile
flutter pub get
flutter run
```

### Production Build

#### Full Stack Build
```bash
# Build all services
docker-compose build

# Start production stack
docker-compose up -d
```

#### Individual Service Builds
```bash
# Backend only
docker-compose build backend

# Frontend only  
docker-compose build frontend
```

## Cloud Build Setup

### 1. Connect to Build Cloud
```bash
# Create cloud buildx instance
docker buildx create --driver cloud banyel/iayo-docker

# Set as default builder
docker buildx use banyel_iayo-docker
```

### 2. Cloud Build Commands

#### Multi-platform Build
```bash
# Build for multiple architectures
docker buildx build --platform linux/amd64,linux/arm64 -t iayos:latest .

# Build and push to registry
docker buildx build --platform linux/amd64,linux/arm64 -t your-registry/iayos:latest --push .
```

#### Service-specific Cloud Builds
```bash
# Backend service
docker buildx build --target backend --platform linux/amd64,linux/arm64 -t iayos-backend:latest .

# Frontend service  
docker buildx build --target frontend --platform linux/amd64,linux/arm64 -t iayos-frontend:latest .
```

## Docker Configuration

### Multi-stage Dockerfile Targets
The Dockerfile includes multiple build stages:

1. **backend**: Django application server
   - Base: Python 3.11-alpine
   - Includes: Django, requirements, gunicorn
   - Ports: 8000

2. **frontend**: Next.js application
   - Base: Node.js 18-alpine  
   - Includes: Next.js build, static assets
   - Ports: 3000

3. **production**: Combined services (if applicable)

### Docker Compose Services

#### Development (docker-compose.dev.yml)
- **backend**: Django with hot reload
- **frontend**: Next.js with hot reload
- **postgres**: Local PostgreSQL database
- **redis**: For caching and sessions

#### Production (docker-compose.yml)
- **backend**: Optimized Django build
- **frontend**: Optimized Next.js build
- **nginx**: Reverse proxy and static file serving
- **postgres**: Production PostgreSQL (or external)

## Build Optimization

### Backend Optimizations
- Alpine Linux base image (smaller size)
- Multi-stage build to exclude dev dependencies
- Non-root user for security
- Health checks for container monitoring

### Frontend Optimizations
- Next.js optimized production build
- Static asset optimization
- Bundle splitting and tree shaking
- Image optimization

### Mobile Optimizations
- Flutter release build with --obfuscate
- Platform-specific optimizations
- Asset bundling and compression

## Deployment Strategies

### Local Development
```bash
# Quick start - all services
npm run dev

# Individual services
npm run dev:backend
npm run dev:frontend
npm run dev:mobile
```

### Staging/Production
```bash
# Production build and deploy
docker-compose build
docker-compose up -d

# With specific environment
docker-compose --env-file .env.production up -d
```

### Cloud Deployment
```bash
# Build and push to cloud registry
docker buildx build --platform linux/amd64,linux/arm64 \
  -t registry.example.com/iayos:$(git rev-parse --short HEAD) \
  --push .

# Deploy via Kubernetes/Docker Swarm
kubectl apply -f k8s-manifests/
```

## Monitoring & Health Checks

### Health Endpoints
- **Backend**: `http://localhost:8000/health/`
- **Frontend**: `http://localhost:3000/api/health`

### Build Verification
```bash
# Test backend API
curl http://localhost:8000/api/accounts/health/

# Test frontend
curl http://localhost:3000/

# Test database connectivity
docker-compose exec backend python src/manage.py check --database default
```

## Troubleshooting

### Common Build Issues

#### Backend Issues
```bash
# Django migrations
docker-compose exec backend python src/manage.py migrate

# Static files collection
docker-compose exec backend python src/manage.py collectstatic

# Create superuser
docker-compose exec backend python src/manage.py createsuperuser
```

#### Frontend Issues
```bash
# Clear Next.js cache
rm -rf apps/frontend_web/.next

# Reinstall dependencies
cd apps/frontend_web && npm ci
```

#### Database Issues
```bash
# Reset database
docker-compose down -v
docker-compose up -d postgres
docker-compose exec backend python src/manage.py migrate
```

### Cloud Build Issues
```bash
# Check buildx status
docker buildx ls

# Switch builder context
docker buildx use default  # Switch back to local
docker buildx use banyel_iayo-docker  # Switch to cloud
```

## Security Considerations

### Build Security
- No secrets in Dockerfile or docker-compose files
- Use .env files for sensitive configuration
- Non-root containers
- Regular base image updates

### Production Security
- HTTPS/TLS termination
- Security headers in nginx
- Database connection encryption
- API rate limiting

## Performance Optimization

### Build Performance
- Docker layer caching
- Multi-stage builds
- Parallel builds with buildx
- Build context optimization (.dockerignore)

### Runtime Performance
- Container resource limits
- Database connection pooling
- Redis caching
- CDN for static assets

---

**Last Updated**: January 2025
**Build Version**: 1.0
**Cloud Builder**: banyel/iayo-docker