# 🚀 Deployment Guide

This guide covers various deployment options for the Thesis Citation Converter.

## 📋 Prerequisites

- Node.js 14+ installed
- npm or yarn package manager
- Git (for version control)
- Basic knowledge of server administration

## 🏠 Local Development

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd thesis-citation-converter

# Install dependencies
npm install

# Build the application
npm run build

# Start the server
npm start
```

### Development Mode

```bash
# Start with hot reloading
npm run dev

# Or use nodemon directly
npx nodemon server.js
```

## 🌐 Production Deployment

### Option 1: Traditional VPS/Server

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install nginx (optional, for reverse proxy)
sudo apt install nginx
```

#### 2. Application Deployment

```bash
# Clone repository
git clone <repository-url> /var/www/citation-converter
cd /var/www/citation-converter

# Install dependencies
npm ci --production

# Build application
npm run build

# Start with PM2
pm2 start server.js --name "citation-converter"
pm2 save
pm2 startup
```

#### 3. Nginx Configuration (Optional)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 2: Docker Deployment

#### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start application
CMD ["npm", "start"]
```

#### 2. Create docker-compose.yml

```yaml
version: '3.8'

services:
  citation-converter:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

#### 3. Deploy with Docker

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Option 3: Cloud Platform Deployment

#### Heroku

1. **Create Heroku app**
   ```bash
   heroku create your-app-name
   ```

2. **Add buildpacks**
   ```bash
   heroku buildpacks:set heroku/nodejs
   ```

3. **Deploy**
   ```bash
   git push heroku main
   ```

4. **Set environment variables**
   ```bash
   heroku config:set NODE_ENV=production
   ```

#### Railway

1. **Connect repository**
   - Go to Railway dashboard
   - Connect your GitHub repository
   - Railway will auto-detect Node.js

2. **Configure environment**
   - Set `NODE_ENV=production`
   - Railway handles the rest automatically

#### DigitalOcean App Platform

1. **Create app**
   - Connect GitHub repository
   - Select Node.js as runtime

2. **Configure build settings**
   ```yaml
   build_command: npm run build
   run_command: npm start
   ```

3. **Set environment variables**
   - `NODE_ENV=production`
   - `PORT=8080` (auto-assigned)

## 🔧 Environment Configuration

### Production Environment Variables

```bash
# Required
NODE_ENV=production
PORT=3000

# Optional
RATE_LIMIT_POINTS=100
RATE_LIMIT_DURATION=60
CORS_ORIGIN=*
```

### Security Considerations

1. **Environment Variables**
   ```bash
   # Never commit .env files
   echo ".env" >> .gitignore
   ```

2. **HTTPS Configuration**
   ```bash
   # Use Let's Encrypt for SSL
   sudo certbot --nginx -d your-domain.com
   ```

3. **Firewall Rules**
   ```bash
   # Allow only necessary ports
   sudo ufw allow 22    # SSH
   sudo ufw allow 80    # HTTP
   sudo ufw allow 443   # HTTPS
   sudo ufw enable
   ```

## 📊 Monitoring and Logging

### PM2 Monitoring

```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs citation-converter

# Restart application
pm2 restart citation-converter
```

### Health Checks

```bash
# Check application health
curl http://localhost:3000/api/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

### Log Management

```bash
# Install logrotate
sudo apt install logrotate

# Configure log rotation
sudo nano /etc/logrotate.d/citation-converter
```

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build application
      run: npm run build
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /var/www/citation-converter
          git pull origin main
          npm ci --production
          npm run build
          pm2 restart citation-converter
```

## 🚨 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Find process using port
   sudo lsof -i :3000
   
   # Kill process
   sudo kill -9 <PID>
   ```

2. **Memory issues**
   ```bash
   # Increase Node.js memory limit
   NODE_OPTIONS="--max-old-space-size=4096" npm start
   ```

3. **Build failures**
   ```bash
   # Clear cache and rebuild
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

### Performance Optimization

1. **Enable compression**
   ```javascript
   // Already enabled in server.js
   app.use(compression());
   ```

2. **Set up caching**
   ```javascript
   // Add caching headers
   app.use((req, res, next) => {
     if (req.url.startsWith('/static/')) {
       res.setHeader('Cache-Control', 'public, max-age=31536000');
     }
     next();
   });
   ```

3. **Database connection pooling** (if using database)
   ```javascript
   // Configure connection pool
   const pool = new Pool({
     max: 20,
     idleTimeoutMillis: 30000,
     connectionTimeoutMillis: 2000,
   });
   ```

## 📈 Scaling

### Horizontal Scaling

1. **Load Balancer Setup**
   ```nginx
   upstream citation_converter {
       server 127.0.0.1:3000;
       server 127.0.0.1:3001;
       server 127.0.0.1:3002;
   }
   ```

2. **Multiple PM2 Instances**
   ```bash
   pm2 start server.js -i max --name "citation-converter"
   ```

### Vertical Scaling

1. **Increase server resources**
   - More CPU cores
   - More RAM
   - SSD storage

2. **Optimize application**
   - Enable clustering
   - Implement caching
   - Database optimization

## 🔒 Security Checklist

- [ ] Environment variables secured
- [ ] HTTPS enabled
- [ ] Firewall configured
- [ ] Rate limiting enabled
- [ ] Input validation in place
- [ ] Security headers set
- [ ] Regular security updates
- [ ] Backup strategy implemented

## 📞 Support

For deployment issues:
1. Check the troubleshooting section
2. Review server logs
3. Verify environment configuration
4. Test API endpoints manually

---

**Happy Deploying! 🚀**