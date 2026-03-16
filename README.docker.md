# Jukebox Docker Setup

## Prerequisites
- Docker Desktop installed
- Docker Compose installed

## Quick Start

### 1. Build and Run
```bash
docker-compose up -d
```

This will:
- Start PostgreSQL database
- Run migrations
- Start the backend API on port 3000
- Start the frontend on port 80

### 2. Access the Application
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3000

## Docker Commands

### Start all services
```bash
docker-compose up -d
```

### Stop all services
```bash
docker-compose down
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Rebuild after code changes
```bash
docker-compose up -d --build
```

### Clean everything (including volumes)
```bash
docker-compose down -v
```

### Access database
```bash
docker exec -it jukebox-db psql -U jukebox -d jukebox
```

### Run Prisma commands
```bash
# Generate Prisma client
docker exec jukebox-backend npx prisma generate

# Run migrations
docker exec jukebox-backend npx prisma migrate dev

# Prisma Studio
docker exec -it jukebox-backend npx prisma studio
```

## Architecture

- **PostgreSQL** (port 5432): Database
- **Backend** (port 3000): NestJS API with Prisma
- **Frontend** (port 80): React + Vite served via Nginx

## Volumes

- `postgres_data`: PostgreSQL database files
- `backend_uploads`: Uploaded song files and cover images

## Production Considerations

Before deploying to production:

1. **Change secrets** in `docker-compose.yml`:
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `POSTGRES_PASSWORD`

2. **Update VITE_API_URL** to your production domain

3. **Add SSL/TLS** using a reverse proxy (nginx, traefik, caddy)

4. **Use `.env` files** instead of hardcoding in docker-compose.yml

5. **Set up backups** for PostgreSQL volume

## Troubleshooting

### Backend fails to start
- Check database is ready: `docker-compose logs postgres`
- Check migrations: `docker-compose logs backend`

### Frontend can't connect to backend
- Verify `VITE_API_URL` in frontend `.env`
- Check backend is running: `docker-compose ps`

### Database connection errors
- Ensure `DATABASE_URL` matches docker-compose service names
- Check postgres health: `docker exec jukebox-db pg_isready -U jukebox`
