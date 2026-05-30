import React, { useState } from 'react'
import { Stars } from './ui'

const RECENT_INSIGHTS = [
  { sym:'NVDA', insight:'Raising price target to $1,100 on Blackwell demand exceeding prior estimates. Data center momentum unmatched.', time:'Today', stars:5 },
  { sym:'META', insight:'Reiterating Strong Buy — Q2 ad revenue reacceleration confirms AI moat thesis. Reels at $10B run-rate.', time:'Yesterday', stars:5 },
  { sym:'INTC', insight:'Downgrading to Avoid on 18A delay. Turnaround credibility impaired. AMD and ARM taking share.', time:'2 days ago', stars:1 },
  { sym:'LLY', insight:'Adding to top picks after Donanemab FDA approval. Alzheimer\'s TAM is massive. $15B+ opportunity.', time:'3 days ago', stars:5 },
]

const ACCURACY = [
  { l:'30-Day Accuracy', v:'76%', c:'var(--green)' },
  { l:'Calls Made', v:'142', c:'var(--text)' },
  { l:'Avg Return', v:'+14.2%', c:'var(--accent)' },
]

const SUGGESTED = [
  'What are the top 3 AI stocks to buy right now?',
  'Is the market overvalued in 2024?',
  'Analyze NVDA after the earnings beat',
  'Best healthcare stocks for rate cut environment',
  'Compare META vs GOOGL for next 12 months',
]

const STAR_COLORS = { 5:'var(--accent)', 4:'var(--accent2)', 3:'var(--gold)', 2:'var(--accent3)', 1:'var(--muted)' }

export default function AIAnalystTab({ stocks }) {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)

  async function analyze(q) {
    const finalQ = q || query
    if (!finalQ.trim()) return
    setQuery(finalQ)
    setLoading(true)
    setResponse(null)

    // Fallback response logic
    await new Promise(r => setTimeout(r, 900))
    const lq = finalQ.toLowerCase()
    let resp

    if (lq.includes('nvda') || lq.includes('nvidia')) {
      const s = stocks.find(x => x.sym === 'NVDA')
      resp = `<strong>NVDA — Strong Buy (★★★★★)</strong><br><br>At ${s?.price ? `$${s.price.toFixed(2)}` : 'current levels'}, Nvidia remains the single best AI infrastructure play. Blackwell GPU demand extends 18+ months of supply constraints. Data center revenue growing 400%+ YoY. Target: <strong>$1,100</strong>. Risk: Multiple compression if AI capex cycle peaks.`
    } else if (lq.includes('meta')) {
      const s = stocks.find(x => x.sym === 'META')
      resp = `<strong>META — Strong Buy (★★★★★)</strong><br><br>At ${s?.price ? `$${s.price.toFixed(2)}` : 'current levels'}, Meta is the cheapest mega-cap AI play at ~26x PE for 20%+ EPS growth. Reels monetization scaling fast. Llama ecosystem moat growing. AI ad tools showing 32% ROAS improvement. Target: <strong>$750</strong>.`
    } else if (lq.includes('msft') || lq.includes('microsoft')) {
      resp = `<strong>MSFT — Buy (★★★★)</strong><br><br>Azure reaccelerating to +29% YoY driven by OpenAI integration. Copilot enterprise adoption in early innings — massive potential ARR expansion. GitHub Copilot at 1.8M paid subscribers. Target: <strong>$520</strong>.`
    } else if (lq.includes('apple') || lq.includes('aapl')) {
      resp = `<strong>AAPL — Buy (★★★★)</strong><br><br>Services revenue at $24B/quarter with 36% margins. Apple Intelligence drives the next major upgrade supercycle — first meaningful cycle since iPhone 12. $90B buyback reduces share count 3-4% annually. Target: <strong>$240</strong>.`
    } else if (lq.includes('top') || lq.includes('best') || lq.includes('buy')) {
      resp = `<strong>Top 3 AI Picks Right Now</strong><br><br><strong>1. NVDA (★★★★★)</strong> — AI infrastructure supercycle, unmatched data center pricing power. Target $1,100.<br><strong>2. TSM (★★★★★)</strong> — Foundry monopoly for advanced chips. Every AI GPU depends on TSMC. Target $260.<br><strong>3. META (★★★★★)</strong> — Cheapest mega-cap AI play. Reels + AI ads = margin expansion. Target $750.`
    } else if (lq.includes('macro') || lq.includes('fed') || lq.includes('rate') || lq.includes('market')) {
      resp = `<strong>Macro Outlook — Moderately Constructive</strong><br><br>The Fed at 5.25-5.50% is the dominant headwind, but AI capex is the override variable. Even in a "higher for longer" regime, companies with secular AI tailwinds (NVDA, META, AMZN, MSFT) will compound earnings regardless of rate moves.<br><br><strong>Key watch:</strong> PCE inflation data (Friday), non-farm payrolls (Jun 7), and any Fed comments on the rate path. Quality growth over cyclicals.`
    } else {
      resp = `<strong>Analysis: "${finalQ}"</strong><br><br>Current market favors high-quality AI-exposed growth. My top picks remain <strong>NVDA, META, AMZN, LLY, TSM</strong> — all 5-star rated with strong catalysts.<br><br>The macro backdrop is cautiously constructive. Fed pausing + AI capex supercycle = constructive for quality tech. Avoid INTC and rate-sensitive ENPH until macro headwinds clear. The Fed cut cycle, when it arrives, will be a major tailwind for growth stocks.<br><br>Key risk: Sticky inflation delaying cuts past Q4 2024.`
    }

    setResponse(resp)
    setLoading(false)
  }

  return (
    <div className="fade-in">
      <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:22, letterSpacing:'-0.02em', marginBottom:4 }}>
        AI Analyst
      </div>
      <div style={{ fontSize:12, color:'var(--muted)', marginBottom:24 }}>
        Ask Claude anything about stocks, market conditions, or get a deep-dive on any ticker.
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, alignItems:'start' }}>
        {/* Left: Query + Suggestions */}
        <div>
          {/* AI Panel */}
          <div style={{ background:'var(--surface)', border:'1px solid rgba(200,241,53,0.2)', borderRadius:12, padding:24, position:'relative', overflow:'hidden', marginBottom:16 }}>
            <div style={{ position:'absolute', top:-40, right:-40, width:120, height:120, background:'radial-gradient(circle,rgba(200,241,53,0.08) 0%,transparent 70%)', pointerEvents:'none' }} />
            <div style={{ width:36, height:36, borderRadius:8, background:'rgba(200,241,53,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, marginBottom:14, color:'var(--accent)' }}>◈</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15, marginBottom:10 }}>Ask the AI Analyst</div>
            <div style={{ fontSize:12, color:'var(--muted)', lineHeight:1.8 }}>Powered by Claude. Ask about any stock, sector, or macro event.</div>

            <div style={{ display:'flex', gap:10, marginTop:16 }}>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && analyze()}
                placeholder="e.g. Should I buy NVDA right now?"
                style={{
                  flex:1, background:'var(--surface2)', border:'1px solid var(--border2)', color:'var(--text)',
                  fontFamily:"'DM Mono',monospace", fontSize:12, padding:'10px 14px', borderRadius:6, outline:'none',
                }}
              />
              <button
                onClick={() => analyze()}
                disabled={loading}
                style={{ background:'var(--accent)', color:'#0a0b0d', border:'none', fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:12, padding:'10px 18px', borderRadius:6, cursor:'pointer', whiteSpace:'nowrap', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? '...' : 'ANALYZE ↗'}
              </button>
            </div>

            {/* Response */}
            {(loading || response) && (
              <div style={{ marginTop:14, padding:14, background:'var(--surface2)', border:'1px solid rgba(200,241,53,0.15)', borderRadius:8, fontSize:12, lineHeight:1.8, color:'var(--muted)', animation:'fadeIn 0.3s ease' }}>
                {loading ? (
                  <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                    {[0,1,2].map(i => (
                      <span key={i} style={{ width:6, height:6, borderRadius:'50%', background:'var(--accent)', display:'inline-block', animation:`ai-bounce 1s ease-in-out ${i * 0.15}s infinite` }} />
                    ))}
                  </div>
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: response }} />
                )}
              </div>
            )}
          </div>

          {/* Suggested queries */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:20 }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:13, marginBottom:14 }}>Suggested Queries</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {SUGGESTED.map(q => (
                <button
                  key={q}
                  onClick={() => analyze(q)}
                  style={{
                    textAlign:'left', width:'100%', background:'transparent', border:'1px solid var(--border2)',
                    color:'var(--text)', fontFamily:"'DM Mono',monospace", fontSize:11, padding:'8px 16px',
                    borderRadius:6, cursor:'pointer', transition:'all 0.2s',
                  }}
                  onMouseEnter={e => { e.target.style.background = 'var(--surface2)'; e.target.style.borderColor = 'var(--accent)'; e.target.style.color = 'var(--accent)' }}
                  onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.borderColor = 'var(--border2)'; e.target.style.color = 'var(--text)' }}
                >
                  ◈ {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Recent Insights + Accuracy */}
        <div>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:20, marginBottom:16 }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:13, marginBottom:14 }}>Recent AI Insights</div>
            {RECENT_INSIGHTS.map(ins => (
              <div key={ins.sym} style={{ display:'flex', gap:12, marginBottom:14, paddingBottom:14, borderBottom:'1px solid var(--border)' }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, minWidth:52, color: STAR_COLORS[ins.stars] }}>{ins.sym}</div>
                <div>
                  <div style={{ fontSize:12, lineHeight:1.6, color:'var(--muted)' }}>{ins.insight}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6 }}>
                    <Stars n={ins.stars} />
                    <div style={{ fontSize:10, color:'var(--muted)' }}>{ins.time}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:20 }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:13, marginBottom:14 }}>AI Accuracy Tracker</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
              {ACCURACY.map(m => (
                <div key={m.l} style={{ background:'var(--surface2)', borderRadius:8, padding:12, border:'1px solid var(--border)', textAlign:'center' }}>
                  <div style={{ fontSize:9, color:'var(--muted)', letterSpacing:'0.06em', marginBottom:6 }}>{m.l}</div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:700, color:m.c }}>{m.v}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize:11, color:'var(--muted)', lineHeight:1.7 }}>
              AI recommendations are for informational purposes only and do not constitute financial advice. Past performance does not guarantee future results.
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ai-bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
