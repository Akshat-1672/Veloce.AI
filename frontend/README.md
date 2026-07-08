# Veloce.AI - Modular Architecture

The project has been completely separated into `frontend` and `backend` directories, each with their own build configurations.

## Running Locally (Docker Compose)
The easiest way to run the full stack is using Docker Compose:
```bash
export API_KEY="your_gemini_api_key"
docker-compose up --build
```
- Frontend will be available at `http://localhost:80`
- Backend will be available at `http://localhost:8000`

## Manual Deployment

### Backend
1. Navigate to `backend/`
2. Build: `docker build -t veloce-backend .`
3. Run: `docker run -p 8000:8000 -e API_KEY="your_key" veloce-backend`

### Frontend
1. Navigate to `frontend/`
2. Build: `docker build -t veloce-frontend .`
3. Run: `docker run -p 80:80 veloce-frontend`

---

## Note on Sandbox Environment
To ensure the sandbox preview continues to work, the root directory contains wrapper files (`index.html`, `index.tsx`, `App.tsx`) that simply point to the `frontend/` directory. When deploying to production, you can safely extract the `frontend/` and `backend/` folders and deploy them independently.
