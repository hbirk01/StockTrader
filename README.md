# PulseStock

AI-powered stock tracker with live prices, Claude's $10K portfolio challenge, congressional trade tracking, options flow, and macro dashboard.

## Stack

- **Backend**: Python + FastAPI — fetches prices from Finnhub, caches them, serves REST API
- **Frontend**: React + Vite — live price grid, auto-trading portfolio, charts

## Quick Start

### 1. Get a free Finnhub API key
Sign up at **finnhub.io/register** (30 seconds, free tier = 60 req/min).

### 2. Backend setup
```bash
cd backend
cp ../.env.example ../.env
# Edit .env and add your FINNHUB_API_KEY

pip install -r ../requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Frontend setup (dev)
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

### 4. Production build
```bash
cd frontend
npm run build          # outputs to frontend/dist/

cd ..
uvicorn backend.main:app --host 0.0.0.0 --port 8000
# FastAPI serves the React build at http://localhost:8000
```

## Deploy to Railway / Render / Fly.io

These platforms support Python directly. Set the env var `FINNHUB_API_KEY` in your platform's dashboard.

**Railway**: Connect repo → set start command to `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`

**Render**: New Web Service → Python → Start command same as above

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/prices` | All stocks with live prices + metadata |
| `GET /api/prices/{sym}` | Single stock quote |
| `GET /api/crypto` | BTC/ETH/BNB prices |
| `GET /api/refresh` | Trigger manual price refresh |
| `GET /api/status` | Health check + data freshness |

## Project Structure

```
stocktrader/
├── backend/
│   ├── main.py          # FastAPI server + price fetching
│   └── stocks.py        # Stock registry (symbols, ratings, targets)
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── hooks/useStocks.js   # API client
│   │   └── components/
│   │       ├── Header.jsx
│   │       ├── StocksTab.jsx    # Main stocks grid
│   │       └── PortfolioTab.jsx # Claude's auto-trading portfolio
│   └── vite.config.js
├── requirements.txt
└── .env.example
```
