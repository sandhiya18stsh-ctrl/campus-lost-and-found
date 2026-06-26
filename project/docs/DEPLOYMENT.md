# Deployment Guide

This guide provides step-by-step instructions for deploying the Campus Lost & Found Network application to production.

## Deployment Architecture

```
┌─────────────┐
│   Domain    │
│   (Cloudflare/Route53)
└──────┬──────┘
       │
┌──────▼──────┐
│  Load       │
│  Balancer   │
│  (Nginx/ALB)│
└──────┬──────┘
       │
       ├────────────┬────────────┐
       │            │            │
┌──────▼──────┐ ┌──▼──────┐ ┌──▼──────┐
│  Frontend   │ │ Backend  │ │PostgreSQL│
│  (Nginx/    │ │ (Gunicorn)│ │ Database │
│  Docker)    │ │ (Docker) │ │          │
└─────────────┘ └──────────┘ └──────────┘
```

## Pre-Deployment Checklist

- [ ] PostgreSQL Database is properly configured and backed up
- [ ] All environment variables are set
- [ ] SSL certificates are obtained
- [ ] DNS records are configured
- [ ] Firewall rules are set up
- [ ] Monitoring and logging are configured
- [ ] Backup strategy is in place
- [ ] Security audit is completed

## Deployment Options

### Option 1: Docker Deployment (Recommended)

#### Prerequisites
- Docker and Docker Compose installed
- 2GB+ RAM available
- Port 80, 443, 8000 available

#### 1. Create Dockerfiles

**Backend Dockerfile** (`backend/Dockerfile`):
```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libaio1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Frontend Dockerfile** (`frontend/Dockerfile`):
```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Nginx Configuration** (`frontend/nginx.conf`):
```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name localhost;

        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }

        location /api {
            proxy_pass http://backend:8000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

#### 2. Create Docker Compose File

`docker-compose.yml`:
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    container_name: lost-found-backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - SECRET_KEY=${SECRET_KEY}
      - CORS_ORIGINS=${CORS_ORIGINS}
    depends_on:
      - oracle
    networks:
      - app-network
    restart: unless-stopped

  frontend:
    build: ./frontend
    container_name: lost-found-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - app-network
    restart: unless-stopped

networks:
  app-network:
    driver: bridge
```

#### 3. Deploy with Docker Compose

```bash
# Build and start services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Option 2: Cloud Platform Deployment

#### AWS Deployment

**1. Deploy to EC2**

```bash
# Launch EC2 instance with Ubuntu 20.04
# Install Docker and Docker Compose
# Clone repository
git clone your-repo-url
cd campus-lost-found

# Build and deploy
docker-compose up -d
```

**2. Deploy to AWS Elastic Beanstalk**

Create `.ebextensions/docker.config`:
```yaml
version: "1"
services:
  api:
    image: your-docker-image
    ports:
      - "8000:8000"
```

Deploy:
```bash
eb init
eb create production
eb deploy
```

**3. Deploy to AWS ECS**

Create `task-definition.json`:
```json
{
  "family": "lost-found-app",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "your-registry/backend:latest",
      "portMappings": [{"containerPort": 8000}],
      "environment": [
        {"name": "DATABASE_URL", "value": "your-db-url"}
      ]
    }
  ]
}
```

#### Google Cloud Platform Deployment

**1. Deploy to Google Cloud Run**

```bash
# Build and push container
gcloud builds submit --tag gcr.io/PROJECT_ID/lost-found-backend

# Deploy to Cloud Run
gcloud run deploy lost-found-backend \
  --image gcr.io/PROJECT_ID/lost-found-backend \
  --platform managed \
  --region us-central1
```

**2. Deploy to Google App Engine**

Create `app.yaml`:
```yaml
runtime: python39
entrypoint: uvicorn main:app --host 0.0.0.0 --port 8080
```

Deploy:
```bash
gcloud app deploy
```

#### Azure Deployment

**1. Deploy to Azure Web Apps**

```bash
# Create web app
az webapp create --resource-group myResourceGroup \
  --plan myAppServicePlan --name myLostFoundApp

# Deploy
git azure webapp deploy
```

### Option 3: Traditional VPS Deployment

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and Node.js
sudo apt install python3.9 python3-pip nodejs npm -y

# Install Nginx
sudo apt install nginx -y

# Install Oracle Instant Client
# Download from Oracle website and install
```

#### 2. Backend Deployment

```bash
# Clone repository
git clone your-repo-url
cd campus-lost-found/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install Gunicorn
pip install gunicorn

# Create systemd service
sudo nano /etc/systemd/system/lost-found-backend.service
```

Systemd service file:
```ini
[Unit]
Description=Lost & Found Backend
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/campus-lost-found/backend
ExecStart=/var/www/campus-lost-found/backend/venv/bin/gunicorn main:app -w 4 -b 0.0.0.0:8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Start service
sudo systemctl start lost-found-backend
sudo systemctl enable lost-found-backend
```

#### 3. Frontend Deployment

```bash
cd frontend
npm install
npm run build

# Copy to web directory
sudo cp -r dist/* /var/www/html/
```

#### 4. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/lost-found
```

Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/lost-found /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## SSL/TLS Configuration

### Using Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Using Cloudflare (Recommended)

1. Add domain to Cloudflare
2. Change nameservers to Cloudflare
3. Enable SSL/TLS (Full mode)
4. Configure SSL/TLS settings

## Environment Variables

### Production Environment Variables

```bash
# Backend (.env)
DATABASE_URL=oracle+cx_oracle://user:password@db-host:1521/SERVICE
SECRET_KEY=your-very-secure-random-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=https://your-domain.com
APP_NAME=Campus Lost & Found Network
DEBUG=False
UPLOAD_DIR=/var/uploads
MAX_UPLOAD_SIZE=5242880

# Frontend (.env)
VITE_API_URL=https://api.your-domain.com
```

## Database Backup Strategy

### Automated Backups

Create backup script `backup-db.sh`:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
expdp campus_lost_found/password@XE DIRECTORY=BACKUP_DIR \
  DUMPFILE=lost_found_$DATE.dmp LOGFILE=backup_$DATE.log

# Keep last 7 days
find /backups -name "lost_found_*.dmp" -mtime +7 -delete
```

Schedule with cron:
```bash
# Daily backup at 2 AM
0 2 * * * /path/to/backup-db.sh
```

### Cloud Database Backups

**AWS RDS**:
- Enable automated backups in RDS console
- Set retention period to 7-30 days
- Enable point-in-time recovery

**Google Cloud SQL**:
- Enable automated backups
- Configure backup retention
- Enable point-in-time recovery

## Monitoring and Logging

### Backend Monitoring

Add monitoring with `prometheus-fastapi-instrumentator`:
```python
from prometheus_fastapi_instrumentator import Instrumentator

Instrumentator().instrument(app).expose(app)
```

### Application Logging

Configure structured logging:
```python
import logging
import json

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_obj = {
            'timestamp': self.formatTime(record),
            'level': record.levelname,
            'message': record.getMessage()
        }
        return json.dumps(log_obj)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

### Monitoring Tools

- **Prometheus + Grafana**: Metrics and visualization
- **Sentry**: Error tracking and alerting
- **CloudWatch (AWS)**: Logs and metrics
- **DataDog**: Full-stack monitoring

## Security Considerations

### 1. Firewall Configuration

```bash
# UFW (Ubuntu)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

### 2. Security Headers

Add to backend:
```python
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware import Middleware
from starlette.middleware.httpsredirect import HTTPSRedirectMiddleware

app = FastAPI(
    middleware=[
        Middleware(TrustedHostMiddleware, allowed_hosts=["your-domain.com"]),
        Middleware(HTTPSRedirectMiddleware),
    ]
)
```

### 3. Rate Limiting

Install slowapi:
```bash
pip install slowapi
```

Add to backend:
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.get("/api/lost-items/")
@limiter.limit("100/minute")
async def get_items():
    ...
```

### 4. Input Validation

Already implemented with Pydantic schemas.

### 5. SQL Injection Prevention

SQLAlchemy ORM automatically prevents SQL injection.

## Performance Optimization

### Backend Optimization

1. **Connection Pooling**:
```python
engine = create_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True
)
```

2. **Caching**:
```bash
pip install redis
pip install fastapi-cache2
```

3. **Async Operations**:
```python
# Use async/await for I/O operations
async def get_items():
    async with async_session() as session:
        result = await session.execute(query)
```

### Frontend Optimization

1. **Code Splitting**:
```javascript
const LostItems = lazy(() => import('./pages/LostItems'));
```

2. **Image Optimization**:
- Use WebP format
- Implement lazy loading
- Use CDN for static assets

3. **Bundle Analysis**:
```bash
npm run build
npm install -g vite-bundle-visualizer
vite-bundle-visualizer
```

## Scaling Strategies

### Horizontal Scaling

1. **Load Balancer**: Use Nginx or AWS ALB
2. **Multiple Backend Instances**: Run multiple containers
3. **Database Read Replicas**: For read-heavy workloads
4. **CDN**: For static assets

### Vertical Scaling

1. Increase server resources (CPU, RAM)
2. Optimize database queries
3. Implement caching layers

## CI/CD Pipeline

### GitHub Actions Example

`.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy Backend
        run: |
          docker build -t backend ./backend
          docker push your-registry/backend
      
      - name: Deploy Frontend
        run: |
          cd frontend
          npm install
          npm run build
          # Upload to S3/CDN
```

## Post-Deployment Checklist

- [ ] Application is accessible via HTTPS
- [ ] Database connection is working
- [ ] API endpoints are responding correctly
- [ ] File uploads are working
- [ ] Email notifications are configured
- [ ] Monitoring is active
- [ ] Backups are running
- [ ] SSL certificates are valid
- [ ] Performance is acceptable
- [ ] Security headers are in place
- [ ] Rate limiting is working
- [ ] Error tracking is configured
- [ ] Logs are being collected

## Troubleshooting

### Backend Won't Start

```bash
# Check logs
docker-compose logs backend

# Check database connection
curl http://localhost:8000/api/health
```

### Frontend Shows Blank Screen

```bash
# Check build output
npm run build

# Check console for errors
# Verify API URL in .env
```

### Database Connection Failed

```bash
# Test connection from server
sqlplus user/password@db-host:1521/service

# Check firewall rules
# Verify Oracle listener is running
```

### High Memory Usage

```bash
# Monitor resource usage
docker stats

# Adjust Docker memory limits
# Optimize database queries
# Implement caching
```

## Maintenance

### Regular Tasks

- **Daily**: Review error logs
- **Weekly**: Review performance metrics
- **Monthly**: Security updates
- **Quarterly**: Review and update dependencies
- **Annually**: Security audit

### Update Process

1. Test updates in staging environment
2. Create database backup before updates
3. Deploy updates during low-traffic periods
4. Monitor after deployment
5. Have rollback plan ready

## Rollback Procedure

```bash
# Docker rollback
docker-compose down
docker-compose up -d --previous-image

# Traditional rollback
git revert HEAD
docker-compose up -d --build
```

## Support

For deployment issues:
1. Check logs in `/var/log/`
2. Review this guide
3. Consult vendor documentation
4. Contact technical support team
