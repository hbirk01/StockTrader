import React, { useState, useEffect } from 'react'
import { Stars } from './ui'

const WATCHLIST_KEY = 'pulsewatchlist-v2'
const DEFAULTS = ['NVDA', 'AAPL', 'META', 'TSLA']

function loadWatchlist() {
  try { return JSON.parse(localStorage.getItem(WATCHLIST_KEY) || 'null') || DEFAULTS } catch { return DEFAULTS }
}
function saveWatchlist(syms) {
  try { localStorage.setItem(WATCHLIST_KEY, JSON.stringify(syms)) } catch {}
}

function WatchCard({ sym, stock, alert, onRemove, onSetAlert }) {
  const up = (stock?.chg || 0) >= 0
  const alertTriggered = !!(alert && stock?.price && (up ? stock.price >= alert : stock.price <= alert))

  return (
    <div style={{
      background:'var(--surface)',
      border:`1px solid ${alertTriggered ? 'rgba(200,241,53,0.4)' : stock ? 'var(--border)' : 'rgba(122,127,142,0.2)'}`,
      borderRadius:12, padding:18, position:'relative', transition:'all 0.2s',
      opacity: stock ? 1 : 0.7,
    }}>
      {alertTriggered && (
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'var(--accent)', borderRadius:'3px 3px 0 0' }} />
      )}

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:20 }}>{sym}</div>
          <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{stock?.name || 'Not in tracked list'}</div>
        </div>
        <button
          onClick={() => onRemove(sym)}
          style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer', fontSize:16, padding:0, lineHeight:1 }}
          title="Remove"
        >×</button>
      </div>

      {stock ? (
        <>
          {/* Price */}
          <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:10 }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:700 }}>${stock.price?.toFixed(2)}</div>
            <div style={{
              fontSize:12, padding:'2px 7px', borderRadius:4,
              background: up ? 'rgba(61,220,132,0.1)' : 'rgba(255,78,78,0.1)',
              color: up ? 'var(--green)' : 'var(--red)',
            }}>
              {up ? '+' : ''}{(stock.chg || 0).toFixed(2)}%
            </div>
          </div>

          <div style={{ marginBottom:12 }}>
            <Stars n={stock.stars} />
          </div>

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
            <div style={{ background:'var(--surface2)', borderRadius:6, padding:8 }}>
              <div style={{ fontSize:9, color:'var(--muted)', marginBottom:2 }}>TARGET</div>
              <div style={{ fontWeight:600, fontSize:13 }}>${stock.target}</div>
            </div>
            <div style={{ background:'var(--surface2)', borderRadius:6, padding:8 }}>
              <div style={{ fontSize:9, color:'var(--muted)', marginBottom:2 }}>SECTOR</div>
              <div style={{ fontSize:11 }}>{stock.sector}</div>
            </div>
          </div>

          {/* Alert */}
          {alert && (
            <div style={{
              fontSize:11, padding:'6px 10px', borderRadius:6, marginBottom:10,
              background: alertTriggered ? 'rgba(200,241,53,0.12)' : 'rgba(122,127,142,0.1)',
              color: alertTriggered ? 'var(--accent)' : 'var(--muted)',
            }}>
              {alertTriggered ? '🔔 ALERT TRIGGERED' : `Alert: $${alert.toFixed(2)}`}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display:'flex', gap:8 }}>
            <button
              onClick={() => onSetAlert(sym, stock.price)}
              style={{ flex:1, background:'transparent', border:'1px solid var(--border2)', color:'var(--muted)', fontSize:11, padding:7, borderRadius:6, cursor:'pointer', transition:'all 0.2s' }}
              onMouseEnter={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.color = 'var(--accent)' }}
              onMouseLeave={e => { e.target.style.borderColor = 'var(--border2)'; e.target.style.color = 'var(--muted)' }}
            >🔔 Alert</button>
            <button
              onClick={() => {/* TODO: link to AI tab */}}
              style={{ flex:1, background:'transparent', border:'1px solid var(--border2)', color:'var(--muted)', fontSize:11, padding:7, borderRadius:6, cursor:'pointer', transition:'all 0.2s' }}
              onMouseEnter={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.color = 'var(--accent)' }}
              onMouseLeave={e => { e.target.style.borderColor = 'var(--border2)'; e.target.style.color = 'var(--muted)' }}
            >◈ AI</button>
          </div>
        </>
      ) : (
        <div style={{ fontSize:12, color:'var(--muted)', marginTop:8 }}>
          Not in tracked list. AI analysis still works.
        </div>
      )}
    </div>
  )
}

export default function WatchlistTab({ stocks }) {
  const [syms, setSyms] = useState(loadWatchlist)
  const [input, setInput] = useState('')
  const [alerts, setAlerts] = useState({})

  function add() {
    const sym = input.trim().toUpperCase()
    if (!sym || syms.includes(sym)) { setInput(''); return }
    const next = [...syms, sym]
    setSyms(next)
    saveWatchlist(next)
    setInput('')
  }

  function remove(sym) {
    const next = syms.filter(s => s !== sym)
    setSyms(next)
    saveWatchlist(next)
  }

  function setAlert(sym, currentPrice) {
    const val = prompt(`Set price alert for ${sym}\nCurrent: $${currentPrice?.toFixed(2) || 'N/A'}\n\nEnter target price:`)
    if (val && !isNaN(val)) {
      setAlerts(prev => ({ ...prev, [sym]: parseFloat(val) }))
    }
  }

  return (
    <div className="fade-in">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:22, letterSpacing:'-0.02em' }}>
          My Watchlist
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="Add ticker (e.g. TSLA)"
            style={{
              background:'var(--surface)', border:'1px solid var(--border2)', color:'var(--text)',
              fontFamily:"'DM Mono',monospace", fontSize:12, padding:'8px 14px', borderRadius:6, outline:'none', width:180
            }}
          />
          <button
            onClick={add}
            style={{ background:'var(--accent)', color:'#0a0b0d', border:'none', fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:12, padding:'9px 18px', borderRadius:6, cursor:'pointer' }}
          >+ ADD</button>
        </div>
      </div>
      <div style={{ fontSize:12, color:'var(--muted)', marginBottom:24 }}>
        Track any stock. Prices update every 60s. Set price alerts and get AI analysis on demand.
      </div>

      {syms.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--muted)' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>⭐</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, marginBottom:6 }}>Your watchlist is empty</div>
          <div style={{ fontSize:12 }}>Type a ticker above and press Enter to add stocks</div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:14 }}>
          {syms.map(sym => (
            <WatchCard
              key={sym}
              sym={sym}
              stock={stocks.find(s => s.sym === sym)}
              alert={alerts[sym]}
              onRemove={remove}
              onSetAlert={setAlert}
            />
          ))}
        </div>
      )}
    </div>
  )
}
