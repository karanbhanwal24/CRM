# Deployment Guide

## Backend

1. Provision PostgreSQL 16+ and create a database/user.
2. Set production environment variables from `backend/.env.example`.
3. Install backend dependencies:
   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
4. Run migrations and collect static files:
   ```bash
   python manage.py migrate
   python manage.py collectstatic --noinput
   ```
5. Start Gunicorn:
   ```bash
   gunicorn config.wsgi:application --bind 0.0.0.0:8000
   ```

## Frontend

1. Set `VITE_API_BASE_URL` to the deployed backend API URL.
2. Build the static assets:
   ```bash
   cd frontend
   npm ci
   npm run build
   ```
3. Serve `frontend/dist` through Nginx, Vercel, Netlify, or another static host.

## Docker Compose

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:8080`
- Backend: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/api/docs/`

## Recommended Hosting

- Backend: Render, Railway, Fly.io, AWS ECS, or a VM with Gunicorn + Nginx
- Frontend: Vercel, Netlify, Cloudflare Pages, or Nginx
- Database: Managed PostgreSQL such as Neon, Railway Postgres, Render Postgres, or RDS
