# Securin Recipe Assignment

This repo contains a full-stack implementation of the assignment:

- Backend: Node.js (Express) + MongoDB (Mongoose)
- Frontend: React (Vite) + Tailwind (CDN) + Axios

## Prerequisites

- Node.js 18+
- MongoDB running locally on `mongodb://127.0.0.1:27017`

## Backend

Location: `backend/`

1) Install dependencies:

```
cd backend
npm install
```

2) Configure env (optional):

Create `.env` with:

```
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/recipes_db
```

3) Import data:

Place `US_recipes.json` at `backend/data/US_recipes.json` (create the folder if needed) and run:

```
npm run import
```

4) Start server:

```
npm run dev
```

Endpoints:

- `GET /api/recipes?page=1&limit=10` — paginated, sorted by rating desc
- `GET /api/recipes/search?calories=<=400&title=pie&rating=>=4.5` — search by filters

## Frontend

Location: `frontend/`

1) Install dependencies:

```
cd ../frontend
npm install
```

2) Run dev server:

```
npm run dev
```

The app expects the backend on `http://localhost:4000`. You can override with an `.env` file in `frontend/`:

```
VITE_API_BASE=http://localhost:4000
```

## Optional: SQL Schema

If you prefer a SQL database, use `sql/schema.sql` as a starting point. The application here uses MongoDB by default.

## API Testing Examples

```
GET http://localhost:4000/api/recipes?page=1&limit=10

GET http://localhost:4000/api/recipes/search?calories=<=400&title=pie&rating=>=4.5
```


