import { useState, useEffect, useCallback, useRef } from 'react'

const BASE = import.meta.env.DEV ? 'http://localhost:8000' : ''

export function useStocks(refreshInterval = 60000) {
  const [stocks, setStocks] = useState([])
  const [lastUpdated, setLastUpdated] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState(null)
  const prevPrices = useRef({})

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/api/prices`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      // Mark price direction for flash animation
      const enriched = data.stocks.map(s => ({
        ...s,
        _priceUp: prevPrices.current[s.sym]
          ? s.price > prevPrices.current[s.sym]
          : null,
      }))
      enriched.forEach(s => { prevPrices.current[s.sym] = s.price })

      setStocks(enriched)
      setLastUpdated(data.last_updated)
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/api/status`)
      setStatus(await res.json())
    } catch {}
  }, [])

  useEffect(() => {
    fetchPrices()
    fetchStatus()
    const priceTimer = setInterval(fetchPrices, refreshInterval)
    const statusTimer = setInterval(fetchStatus, 15000)
    return () => { clearInterval(priceTimer); clearInterval(statusTimer) }
  }, [fetchPrices, fetchStatus, refreshInterval])

  const triggerRefresh = async () => {
    await fetch(`${BASE}/api/refresh`)
    setTimeout(fetchPrices, 2000)
  }

  return { stocks, lastUpdated, loading, error, status, triggerRefresh, refetch: fetchPrices }
}

export function useCrypto() {
  const [crypto, setCrypto] = useState({})
  useEffect(() => {
    fetch(`${BASE}/api/crypto`)
      .then(r => r.json())
      .then(setCrypto)
      .catch(() => {})
    const t = setInterval(() => {
      fetch(`${BASE}/api/crypto`).then(r => r.json()).then(setCrypto).catch(() => {})
    }, 120000)
    return () => clearInterval(t)
  }, [])
  return crypto
}
