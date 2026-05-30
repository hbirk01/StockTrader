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

# ── In-memory caches ─────────────────────────────────────────────
# price_cache: real-time data (Alpaca, refreshed every 60s)
# fundamentals_cache: PE, market cap, 52W high/low (FMP, refreshed every 4h)
price_cache: dict = {}
fundamentals_cache: dict = {}   # { sym: { pe, market_cap, year_high, year_low } }
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
    asyncio.create_task(refresh_fundamentals())
    asyncio.create_task(fundamentals_refresh_loop())
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
    """Fetch all stock prices — Alpaca first (one call, real-time), FMP/AV for gaps."""
    global price_cache, last_updated, is_fetching
    if is_fetching:
        return
    is_fetching = True
    log.info("Refreshing prices for %d stocks...", len(SYMBOLS))

    # 1. Alpaca real-time snapshots (all symbols in a single request, no rate limit)
    alpaca_prices = await fetch_alpaca_snapshots_batch()
    for sym, quote in alpaca_prices.items():
        price_cache[sym] = quote

    # 2. FMP / Alpha Vantage fallback for any symbols Alpaca didn't return
    missing = [s for s in SYMBOLS if s not in price_cache]
    if missing:
        log.info("FMP/AV fallback for %d missing symbols", len(missing))
        batch_size = 15
        updated = 0
        for i in range(0, len(missing), batch_size):
            batch = missing[i:i + batch_size]
            results = await asyncio.gather(
                *[fetch_quote(sym) for sym in batch],
                return_exceptions=True,
            )
            for sym, result in zip(batch, results):
                if isinstance(result, dict) and result:
                    price_cache[sym] = result
                    updated += 1
            if i + batch_size < len(missing):
                await asyncio.sleep(0.3)
        log.info("FMP/AV filled %d/%d gaps", updated, len(missing))

    last_updated = datetime.utcnow()
    is_fetching = False
    log.info("Price refresh complete: %d/%d in cache", len(price_cache), len(SYMBOLS))


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


# ── Fundamentals cache (PE, market cap, 52W) ────────────────────
# FMP is rate-limited on the free tier, so we only fetch fundamentals
# once at startup and then every 4 hours. Prices stay on Alpaca.

async def refresh_fundamentals():
    """Fetch PE, market cap, 52W high/low from FMP. Rate-limited: run infrequently."""
    global fundamentals_cache
    log.info("Refreshing fundamentals for %d symbols via FMP...", len(SYMBOLS))
    batch_size = 15
    filled = 0
    for i in range(0, len(SYMBOLS), batch_size):
        batch = SYMBOLS[i:i + batch_size]
        results = await asyncio.gather(
            *[fetch_fmp_quote(sym) for sym in batch],
            return_exceptions=True,
        )
        for sym, result in zip(batch, results):
            if isinstance(result, dict) and result:
                fundamentals_cache[sym] = {
                    "pe":         result.get("pe"),
                    "market_cap": result.get("market_cap"),
                    "year_high":  result.get("year_high"),
                    "year_low":   result.get("year_low"),
                }
                filled += 1
        if i + batch_size < len(SYMBOLS):
            await asyncio.sleep(0.4)
    log.info("Fundamentals refresh complete: %d/%d symbols", filled, len(SYMBOLS))


# ── Background refresh loops ─────────────────────────────────────

async def price_refresh_loop():
    while True:
        await asyncio.sleep(60)  # refresh every 60 seconds
        await refresh_all_prices()
        await refresh_crypto()


async def fundamentals_refresh_loop():
    while True:
        await asyncio.sleep(4 * 3600)  # every 4 hours
        await refresh_fundamentals()


# ── API Routes ───────────────────────────────────────────────────

@app.get("/api/prices")
async def get_all_prices():
    """All cached stock prices + metadata."""
    result = []
    for stock in STOCKS:
        sym = stock["sym"]
        quote = price_cache.get(sym, {})
        fund = fundamentals_cache.get(sym, {})
        result.append({
            **stock,
            "price":      quote.get("price"),
            "chg":        quote.get("chg", 0),
            "change":     quote.get("change", 0),
            "high":       quote.get("high"),
            "low":        quote.get("low"),
            "open":       quote.get("open"),
            "prev_close": quote.get("prev_close"),
            "volume":     quote.get("volume"),
            "source":     quote.get("source", "pending"),
            # Fundamentals from dedicated FMP cache (survive Alpaca being primary)
            "pe":         fund.get("pe")         or quote.get("pe"),
            "market_cap": fund.get("market_cap") or quote.get("market_cap"),
            "year_high":  fund.get("year_high")  or quote.get("year_high"),
            "year_low":   fund.get("year_low")   or quote.get("year_low"),
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


# ── News endpoint ────────────────────────────────────────────────

_BULLISH = {"beats","beat","record","upgrade","growth","strong","surges","surge","rally",
            "profit","exceeds","raises","bullish","breakout","acquisition","deal","boost",
            "gains","rises","rises","higher","outperforms","tops","expands","wins","launches",
            "milestone","partnership","approved","approval","positive","revenue","soars"}
_BEARISH = {"misses","miss","warning","downgrade","loss","decline","falls","drops","lawsuit",
            "recall","crash","cut","slump","disappoints","bearish","layoffs","bankruptcy",
            "fraud","investigation","lower","weak","concern","risk","scrutiny","probe",
            "charges","fine","penalty","deficit","shortfall","suspended","failed","failure"}

def _headline_sentiment(text: str) -> str:
    words = set(text.lower().split())
    bull = len(words & _BULLISH)
    bear = len(words & _BEARISH)
    if bull > bear: return "bullish"
    if bear > bull: return "bearish"
    return "neutral"


@app.get("/api/news")
async def get_news(symbols: str = "", limit: int = 50):
    """Fetch latest news from Alpaca with keyword-based sentiment scoring."""
    if not ALPACA_KEY or not ALPACA_SECRET:
        return []
    params: dict = {"limit": min(limit, 50), "sort": "desc", "include_content": "false"}
    if symbols:
        params["symbols"] = symbols
    try:
        r = await http_client.get(
            "https://data.alpaca.markets/v1beta1/news",
            headers=_alpaca_headers(),
            params=params,
        )
        if r.status_code != 200:
            log.warning("Alpaca news HTTP %s", r.status_code)
            return []
        articles = r.json().get("news", [])
        return [
            {
                "id":          a.get("id"),
                "headline":    a.get("headline", ""),
                "summary":     a.get("summary", ""),
                "author":      a.get("author", ""),
                "source":      a.get("source", ""),
                "url":         a.get("url", ""),
                "publishedAt": a.get("created_at", ""),
                "symbols":     a.get("symbols", []),
                "sentiment":   _headline_sentiment(a.get("headline", "")),
            }
            for a in articles
        ]
    except Exception as e:
        log.warning("News fetch error: %s", e)
        return []


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


# ── Alpaca integration ───────────────────────────────────────────
# Stateless key/secret auth — no login step needed.
# Paper trading is the default; set ALPACA_PAPER=false for live.

ALPACA_KEY    = os.getenv("ALPACA_API_KEY", "")
ALPACA_SECRET = os.getenv("ALPACA_SECRET_KEY", "")
ALPACA_PAPER  = os.getenv("ALPACA_PAPER", "true").lower() != "false"

ALPACA_DATA_BASE = "https://data.alpaca.markets/v2"

def _alpaca_base() -> str:
    return "https://paper-api.alpaca.markets" if ALPACA_PAPER else "https://api.alpaca.markets"

def _alpaca_headers() -> dict:
    return {"APCA-API-KEY-ID": ALPACA_KEY, "APCA-API-SECRET-KEY": ALPACA_SECRET}


async def fetch_alpaca_snapshots_batch() -> dict:
    """Fetch all stock snapshots from Alpaca in one API call. Returns {sym: quote}."""
    if not ALPACA_KEY or not ALPACA_SECRET:
        return {}
    try:
        r = await http_client.get(
            f"{ALPACA_DATA_BASE}/stocks/snapshots",
            headers=_alpaca_headers(),
            params={"symbols": ",".join(SYMBOLS), "feed": "iex"},
        )
        if r.status_code != 200:
            log.warning("Alpaca snapshots HTTP %s", r.status_code)
            return {}
        result = {}
        for sym, snap in r.json().items():
            trade    = snap.get("latestTrade", {})
            daily    = snap.get("dailyBar", {})
            prev     = snap.get("prevDailyBar", {})
            price    = float(trade.get("p") or daily.get("c") or 0)
            prev_c   = float(prev.get("c") or 0)
            if not price:
                continue
            change   = price - prev_c
            chg_pct  = round((change / prev_c * 100) if prev_c else 0, 2)
            result[sym] = {
                "price":      round(price, 2),
                "chg":        chg_pct,
                "change":     round(change, 2),
                "high":       daily.get("h"),
                "low":        daily.get("l"),
                "open":       daily.get("o"),
                "prev_close": round(prev_c, 2) if prev_c else None,
                "volume":     daily.get("v"),
                "source":     "alpaca",
            }
        log.info("Alpaca snapshots: %d/%d prices fetched", len(result), len(SYMBOLS))
        return result
    except Exception as e:
        log.warning("Alpaca snapshots error: %s", e)
        return {}


@app.get("/api/alpaca")
async def get_alpaca():
    """Return live Alpaca portfolio. Requires ALPACA_API_KEY + ALPACA_SECRET_KEY in .env."""
    if not ALPACA_KEY or not ALPACA_SECRET:
        return {
            "connected": False,
            "error": "Add ALPACA_API_KEY and ALPACA_SECRET_KEY to .env",
        }

    base    = _alpaca_base()
    headers = _alpaca_headers()

    try:
        account_r, positions_r = await asyncio.gather(
            http_client.get(f"{base}/v2/account",   headers=headers),
            http_client.get(f"{base}/v2/positions", headers=headers),
        )
    except Exception as e:
        log.warning("Alpaca HTTP error: %s", e)
        return {"connected": False, "error": str(e)}

    if account_r.status_code in (401, 403):
        return {"connected": False, "error": "Invalid API credentials — check ALPACA_API_KEY / ALPACA_SECRET_KEY"}

    if account_r.status_code != 200:
        return {"connected": False, "error": f"Alpaca returned HTTP {account_r.status_code}"}

    account        = account_r.json()
    positions_data = positions_r.json() if positions_r.status_code == 200 else []

    positions = []
    for p in (positions_data if isinstance(positions_data, list) else []):
        sym  = p.get("symbol", "")
        name = STOCK_MAP.get(sym, {}).get("name", sym)   # use known name or fall back to ticker
        unrealized_plpc = float(p.get("unrealized_plpc", 0) or 0)
        positions.append({
            "sym":     sym,
            "name":    name,
            "shares":  float(p.get("qty", 0) or 0),
            "avgCost": float(p.get("avg_entry_price", 0) or 0),
            "price":   float(p.get("current_price", 0) or 0),
            "equity":  float(p.get("market_value", 0) or 0),
            "pnl":     float(p.get("unrealized_pl", 0) or 0),
            "pnlPct":  round(unrealized_plpc * 100, 2),  # Alpaca gives decimal, convert to %
        })

    return {
        "connected":     True,
        "paper":         ALPACA_PAPER,
        "accountNumber": account.get("account_number", ""),
        "equity":        float(account.get("equity", 0) or 0),
        "cash":          float(account.get("cash", 0) or 0),
        "buyingPower":   float(account.get("buying_power", 0) or 0),
        "dayPnl":        float(account.get("equity", 0) or 0) - float(account.get("last_equity", 0) or 0),
        "positions":     positions,
    }


# ── Alpaca: portfolio history ────────────────────────────────────

@app.get("/api/alpaca/history")
async def get_alpaca_history(period: str = "1M"):
    """Return portfolio equity history. period: 1W | 1M | 3M | 1Y"""
    if not ALPACA_KEY or not ALPACA_SECRET:
        return {"error": "No credentials"}
    # Alpaca uses "1A" for 1 year; timeframe 1H for short periods, 1D for longer
    period_map  = {"1W": ("1W", "1H"), "1M": ("1M", "1D"), "3M": ("3M", "1D"), "1Y": ("1A", "1D")}
    alp_period, timeframe = period_map.get(period, ("1M", "1D"))
    base    = _alpaca_base()
    headers = _alpaca_headers()
    try:
        r = await http_client.get(
            f"{base}/v2/portfolio/history",
            headers=headers,
            params={"period": alp_period, "timeframe": timeframe, "intraday_reporting": "market_hours"},
        )
        if r.status_code != 200:
            return {"error": f"Alpaca HTTP {r.status_code}"}
        raw        = r.json()
        timestamps = raw.get("timestamp", [])
        equity_arr = raw.get("equity", [])
        pl_arr     = raw.get("profit_loss", [])
        points = []
        for i, ts in enumerate(timestamps):
            eq  = equity_arr[i]  if i < len(equity_arr)  else None
            pl  = pl_arr[i]      if i < len(pl_arr)       else None
            if eq is None:
                continue
            from datetime import timezone
            dt = datetime.fromtimestamp(ts, tz=timezone.utc)
            label = dt.strftime("%b %d") if timeframe == "1D" else dt.strftime("%b %d %H:%M")
            points.append({"date": label, "equity": round(float(eq), 2), "pnl": round(float(pl or 0), 2)})
        return {"points": points, "period": period}
    except Exception as e:
        log.warning("Alpaca history error: %s", e)
        return {"error": str(e)}


# ── Alpaca: order history ────────────────────────────────────────

@app.get("/api/alpaca/orders")
async def get_alpaca_orders():
    """Return the 50 most recent orders (all statuses)."""
    if not ALPACA_KEY or not ALPACA_SECRET:
        return []
    base    = _alpaca_base()
    headers = _alpaca_headers()
    try:
        r = await http_client.get(
            f"{base}/v2/orders",
            headers=headers,
            params={"status": "all", "limit": 50, "direction": "desc"},
        )
        if r.status_code != 200:
            return []
        orders = r.json()
        if not isinstance(orders, list):
            return []
        result = []
        for o in orders:
            result.append({
                "id":          o.get("id"),
                "sym":         o.get("symbol"),
                "side":        o.get("side"),
                "qty":         float(o.get("qty", 0) or 0),
                "filledQty":   float(o.get("filled_qty", 0) or 0),
                "filledPrice": float(o.get("filled_avg_price", 0) or 0),
                "type":        o.get("type"),
                "status":      o.get("status"),
                "createdAt":   o.get("created_at"),
            })
        return result
    except Exception as e:
        log.warning("Alpaca orders error: %s", e)
        return []


# ── Alpaca: place order ──────────────────────────────────────────

@app.post("/api/alpaca/order")
async def place_alpaca_order(request: Request):
    """Place a market or limit order via Alpaca."""
    if not ALPACA_KEY or not ALPACA_SECRET:
        raise HTTPException(400, "Alpaca credentials not configured")
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(400, "Invalid JSON")

    symbol      = (body.get("symbol") or "").upper().strip()
    qty         = body.get("qty")
    side        = body.get("side", "").lower()
    order_type  = body.get("type", "market").lower()
    limit_price = body.get("limitPrice")

    if not symbol or not qty or side not in ("buy", "sell"):
        raise HTTPException(400, "symbol, qty, and side (buy|sell) are required")

    order_body: dict = {
        "symbol":        symbol,
        "qty":           str(qty),
        "side":          side,
        "type":          order_type,
        "time_in_force": "day",
    }
    if order_type == "limit" and limit_price:
        order_body["limit_price"] = str(limit_price)

    base    = _alpaca_base()
    headers = {**_alpaca_headers(), "Content-Type": "application/json"}
    try:
        r = await http_client.post(f"{base}/v2/orders", headers=headers, json=order_body)
        data = r.json()
        if r.status_code not in (200, 201):
            return {"ok": False, "error": data.get("message", f"HTTP {r.status_code}")}
        return {
            "ok":      True,
            "orderId": data.get("id"),
            "status":  data.get("status"),
            "symbol":  data.get("symbol"),
            "qty":     data.get("qty"),
            "side":    data.get("side"),
            "type":    data.get("type"),
        }
    except Exception as e:
        log.warning("Alpaca order error: %s", e)
        return {"ok": False, "error": str(e)}


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
