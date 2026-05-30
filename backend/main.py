"""
PulseStock Backend
FastAPI server that fetches real prices from Finnhub + FMP,
caches them, and exposes a clean REST API to the frontend.
"""

import os
import json
import asyncio
import logging
from datetime import datetime
from typing import Optional
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv

from stocks import STOCKS, SYMBOLS, STOCK_MAP

load_dotenv()

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("pulsestockj")

FMP_KEY          = os.getenv("FMP_API_KEY", "demo")
AV_KEY           = os.getenv("ALPHA_VANTAGE_API_KEY", "")
MARKETSTACK_KEY  = os.getenv("MARKETSTACK_API_KEY", "")

# ── In-memory price cache ────────────────────────────────────────
# { "NVDA": { "price": 135.2, "chg": 1.4, "high": 136.0, ... } }
price_cache: dict = {}
crypto_cache: dict = {}
last_updated: Optional[datetime] = None
is_fetching: bool = False

# ── HTTP client ──────────────────────────────────────────────────
http_client: Optional[httpx.AsyncClient] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global http_client
    http_client = httpx.AsyncClient(timeout=10.0)
    log.info("HTTP client started")
    asyncio.create_task(refresh_all_prices())
    asyncio.create_task(price_refresh_loop())
    asyncio.create_task(refresh_crypto())
    # Try Robinhood login on startup if credentials are present
    if ROBINHOOD_USER and ROBINHOOD_PASS:
        loop = asyncio.get_event_loop()
        loop.run_in_executor(None, _rh_login)
    async def _marketstack_startup():
        await asyncio.sleep(10)
        await fetch_marketstack_batch()
    asyncio.create_task(_marketstack_startup())
    yield
    await http_client.aclose()
    log.info("HTTP client closed")


app = FastAPI(title="PulseStock API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


# ── Price fetching ───────────────────────────────────────────────


async def fetch_fmp_quote(sym: str) -> Optional[dict]:
    """Fallback: FMP quote endpoint."""
    api_sym = sym.replace("-", "")  # BRK-B → BRKB for FMP
    try:
        r = await http_client.get(
            f"https://financialmodelingprep.com/api/v3/quote/{api_sym}",
            params={"apikey": FMP_KEY},
        )
        data = r.json()
        if not data or not isinstance(data, list) or not data[0].get("price"):
            return None
        q = data[0]
        return {
            "price":       round(q["price"], 2),
            "chg":         round(q.get("changesPercentage", 0), 2),
            "change":      round(q.get("change", 0), 2),
            "high":        q.get("dayHigh"),
            "low":         q.get("dayLow"),
            "open":        q.get("open"),
            "prev_close":  q.get("previousClose"),
            "pe":          q.get("pe"),
            "market_cap":  q.get("marketCap"),
            "volume":      q.get("volume"),
            "avg_volume":  q.get("avgVolume"),
            "year_high":   q.get("yearHigh"),
            "year_low":    q.get("yearLow"),
            "source":      "fmp",
        }
    except Exception as e:
        log.warning(f"FMP error for {sym}: {e}")
        return None


async def fetch_alpha_vantage_quote(sym: str) -> Optional[dict]:
    """Fallback: Alpha Vantage GLOBAL_QUOTE endpoint (25 req/day free tier)."""
    if not AV_KEY:
        return None
    try:
        r = await http_client.get(
            "https://www.alphavantage.co/query",
            params={"function": "GLOBAL_QUOTE", "symbol": sym, "apikey": AV_KEY},
        )
        data = r.json().get("Global Quote", {})
        price = float(data.get("05. price", 0) or 0)
        if not price:
            return None
        prev = float(data.get("08. previous close", 0) or 0)
        change = float(data.get("09. change", 0) or 0)
        chg_pct = round((change / prev * 100) if prev else 0, 2)
        return {
            "price":      round(price, 2),
            "chg":        chg_pct,
            "change":     round(change, 2),
            "high":       float(data.get("03. high", 0) or 0) or None,
            "low":        float(data.get("04. low", 0) or 0) or None,
            "open":       float(data.get("02. open", 0) or 0) or None,
            "prev_close": round(prev, 2) if prev else None,
            "volume":     int(data.get("06. volume", 0) or 0) or None,
            "source":     "alphavantage",
        }
    except Exception as e:
        log.warning(f"Alpha Vantage error for {sym}: {e}")
        return None


async def fetch_quote(sym: str) -> Optional[dict]:
    """Fetch quote — FMP primary, Alpha Vantage fallback."""
    quote = await fetch_fmp_quote(sym)
    if quote:
        return quote
    return await fetch_alpha_vantage_quote(sym)


async def refresh_all_prices():
    """Fetch all stock prices concurrently in batches."""
    global price_cache, last_updated, is_fetching
    if is_fetching:
        return
    is_fetching = True
    log.info(f"Refreshing prices for {len(SYMBOLS)} stocks...")

    # Batch into groups of 15 with small delay to avoid rate limits
    batch_size = 15
    updated = 0
    for i in range(0, len(SYMBOLS), batch_size):
        batch = SYMBOLS[i:i + batch_size]
        results = await asyncio.gather(
            *[fetch_quote(sym) for sym in batch],
            return_exceptions=True,
        )
        for sym, result in zip(batch, results):
            if isinstance(result, dict) and result:
                price_cache[sym] = result
                updated += 1
        if i + batch_size < len(SYMBOLS):
            await asyncio.sleep(0.3)

    last_updated = datetime.utcnow()
    is_fetching = False
    log.info(f"Price refresh complete: {updated}/{len(SYMBOLS)} updated")


async def fetch_marketstack_batch() -> None:
    """Batch-fetch EOD prices for all symbols in 1-2 API calls.
    Marketstack free = 100 req/month — only called once at startup to fill gaps.
    """
    if not MARKETSTACK_KEY:
        return
    batch_size = 50  # Marketstack allows up to 50 symbols per request
    syms_needing_price = [s for s in SYMBOLS if s not in price_cache]
    if not syms_needing_price:
        return
    log.info(f"Marketstack: filling {len(syms_needing_price)} missing prices...")
    for i in range(0, len(syms_needing_price), batch_size):
        batch = syms_needing_price[i:i + batch_size]
        try:
            r = await http_client.get(
                "http://api.marketstack.com/v1/eod/latest",
                params={"access_key": MARKETSTACK_KEY, "symbols": ",".join(batch), "limit": batch_size},
            )
            items = r.json().get("data", [])
            for item in items:
                sym = item.get("symbol", "").replace(".XNYS", "").replace(".XNAS", "")
                price = item.get("close") or item.get("adj_close")
                if sym and price:
                    prev = item.get("open") or price
                    change = round(price - prev, 2)
                    price_cache[sym] = {
                        "price":      round(float(price), 2),
                        "chg":        round((change / prev * 100) if prev else 0, 2),
                        "change":     change,
                        "high":       item.get("high"),
                        "low":        item.get("low"),
                        "open":       item.get("open"),
                        "prev_close": item.get("open"),
                        "volume":     item.get("volume"),
                        "source":     "marketstack",
                    }
            log.info(f"Marketstack: filled {len(items)} prices from batch {i // batch_size + 1}")
        except Exception as e:
            log.warning(f"Marketstack batch error: {e}")


async def refresh_crypto():
    """Fetch BTC/ETH from CoinStats (open CORS, no key)."""
    global crypto_cache
    try:
        r = await http_client.get(
            "https://api.coinstats.app/public/v1/coins",
            params={"skip": 0, "limit": 3, "currency": "USD"},
        )
        coins = r.json().get("coins", [])
        id_map = {"bitcoin": "BTC", "ethereum": "ETH", "binancecoin": "BNB"}
        for coin in coins:
            ticker = id_map.get(coin.get("id", ""))
            if ticker:
                crypto_cache[ticker] = {
                    "price": coin["price"],
                    "chg":   round(coin.get("priceChange1d", 0), 2),
                }
        log.info(f"Crypto updated: BTC ${crypto_cache.get('BTC', {}).get('price', 'N/A')}")
    except Exception as e:
        log.warning(f"Crypto fetch error: {e}")


# ── Background refresh loop ──────────────────────────────────────

async def price_refresh_loop():
    while True:
        await asyncio.sleep(60)  # refresh every 60 seconds
        await refresh_all_prices()
        await refresh_crypto()


# ── API Routes ───────────────────────────────────────────────────

@app.get("/api/prices")
async def get_all_prices():
    """All cached stock prices + metadata."""
    result = []
    for stock in STOCKS:
        sym = stock["sym"]
        quote = price_cache.get(sym, {})
        result.append({
            **stock,
            "price":      quote.get("price"),
            "chg":        quote.get("chg", 0),
            "change":     quote.get("change", 0),
            "high":       quote.get("high"),
            "low":        quote.get("low"),
            "open":       quote.get("open"),
            "prev_close": quote.get("prev_close"),
            "pe":         quote.get("pe"),
            "market_cap": quote.get("market_cap"),
            "volume":     quote.get("volume"),
            "year_high":  quote.get("year_high"),
            "year_low":   quote.get("year_low"),
            "source":     quote.get("source", "pending"),
        })
    return {
        "stocks": result,
        "last_updated": last_updated.isoformat() if last_updated else None,
        "count": len(result),
    }


@app.get("/api/prices/{sym}")
async def get_price(sym: str):
    """Single stock price + metadata."""
    sym = sym.upper()
    if sym not in STOCK_MAP:
        raise HTTPException(404, f"Symbol {sym} not tracked")
    stock = STOCK_MAP[sym]
    quote = price_cache.get(sym, {})
    return {**stock, **quote}


@app.get("/api/crypto")
async def get_crypto():
    """BTC/ETH/BNB prices from CoinStats."""
    if not crypto_cache:
        await refresh_crypto()
    return crypto_cache


@app.get("/api/refresh")
async def trigger_refresh():
    """Manually trigger a price refresh."""
    asyncio.create_task(refresh_all_prices())
    return {"status": "refresh triggered", "symbols": len(SYMBOLS)}


@app.get("/api/status")
async def get_status():
    """Health check + data freshness."""
    cached = sum(1 for sym in SYMBOLS if sym in price_cache)
    return {
        "status": "ok",
        "prices_cached": cached,
        "total_symbols": len(SYMBOLS),
        "last_updated": last_updated.isoformat() if last_updated else None,
        "is_fetching": is_fetching,
    }


# ── Robinhood integration ────────────────────────────────────────
import threading

ROBINHOOD_USER   = os.getenv("ROBINHOOD_USERNAME", "")
ROBINHOOD_PASS   = os.getenv("ROBINHOOD_PASSWORD", "")
ROBINHOOD_TOTP   = os.getenv("ROBINHOOD_TOTP_SECRET", "")   # TOTP secret from Robinhood 2FA setup

_rh_logged_in: bool = False
_rh_portfolio_cache: dict = {}
_rh_lock = threading.Lock()


def _rh_login() -> bool:
    """Attempt Robinhood login. Returns True on success."""
    global _rh_logged_in
    if not ROBINHOOD_USER or not ROBINHOOD_PASS:
        return False
    try:
        import robin_stocks.robinhood as rh
        import pyotp
        kwargs = {}
        if ROBINHOOD_TOTP:
            kwargs["mfa_code"] = pyotp.TOTP(ROBINHOOD_TOTP).now()
        rh.login(ROBINHOOD_USER, ROBINHOOD_PASS, **kwargs)
        _rh_logged_in = True
        log.info("Robinhood: logged in as %s", ROBINHOOD_USER)
        return True
    except Exception as e:
        log.warning("Robinhood login failed: %s", e)
        _rh_logged_in = False
        return False


def _rh_fetch_portfolio() -> dict:
    """Fetch and return portfolio data from Robinhood. Caches result."""
    global _rh_portfolio_cache, _rh_logged_in
    try:
        import robin_stocks.robinhood as rh
        if not _rh_logged_in:
            if not _rh_login():
                return {"connected": False, "error": "Not logged in — add ROBINHOOD_USERNAME / ROBINHOOD_PASSWORD to .env"}

        profile   = rh.load_portfolio_profile() or {}
        holdings  = rh.build_holdings() or {}
        account   = rh.load_account_profile() or {}

        positions = []
        for sym, h in holdings.items():
            positions.append({
                "sym":        sym,
                "name":       h.get("name", sym),
                "shares":     float(h.get("quantity", 0)),
                "avgCost":    float(h.get("average_buy_price", 0)),
                "price":      float(h.get("price", 0)),
                "equity":     float(h.get("equity", 0)),
                "pnl":        float(h.get("equity_change", 0)),
                "pnlPct":     float(h.get("percent_change", 0)),
                "pe":         h.get("pe_ratio"),
            })

        result = {
            "connected":        True,
            "username":         ROBINHOOD_USER,
            "equity":           float(profile.get("equity", 0)),
            "cash":             float(account.get("cash", 0)),
            "totalReturn":      float(profile.get("total_return", 0) or 0),
            "dayReturn":        float(profile.get("equity_previous_close", 0) or 0),
            "marketValue":      float(profile.get("market_value", 0) or 0),
            "positions":        positions,
        }
        _rh_portfolio_cache = result
        return result
    except Exception as e:
        log.warning("Robinhood portfolio fetch failed: %s", e)
        _rh_logged_in = False
        if _rh_portfolio_cache:
            return {**_rh_portfolio_cache, "stale": True}
        return {"connected": False, "error": str(e)}


@app.get("/api/robinhood")
async def get_robinhood():
    """Return live Robinhood portfolio. Requires credentials in .env."""
    loop = asyncio.get_event_loop()
    data = await loop.run_in_executor(None, _rh_fetch_portfolio)
    return data


@app.get("/api/robinhood/status")
async def get_robinhood_status():
    return {"connected": _rh_logged_in, "username": ROBINHOOD_USER if _rh_logged_in else None}


# ── Portfolio persistence ────────────────────────────────────────
# Stored in portfolio_data.json next to this file — gitignored so
# git pushes never erase it.

import pathlib
_PORTFOLIO_FILE = pathlib.Path(__file__).parent / "portfolio_data.json"

def _read_portfolio() -> dict:
    try:
        if _PORTFOLIO_FILE.exists():
            return json.loads(_PORTFOLIO_FILE.read_text())
    except Exception as e:
        log.warning("portfolio read error: %s", e)
    return {}

def _write_portfolio(data: dict) -> None:
    try:
        _PORTFOLIO_FILE.write_text(json.dumps(data, indent=2))
    except Exception as e:
        log.warning("portfolio write error: %s", e)


@app.get("/api/portfolio")
async def get_portfolio():
    """Return the persisted Claude portfolio state."""
    return _read_portfolio()


@app.post("/api/portfolio")
async def save_portfolio(request: Request):
    """Persist the Claude portfolio state sent from the frontend."""
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")
    _write_portfolio(body)
    return {"ok": True}


# ── Serve frontend ───────────────────────────────────────────────
# Static files (JS, CSS) served from frontend/dist after build
import pathlib
frontend_dist = pathlib.Path(__file__).parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        return FileResponse(str(frontend_dist / "index.html"))
