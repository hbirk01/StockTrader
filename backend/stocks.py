"""
Central stock registry — symbols, names, sectors, AI ratings, and targets.
Prices are NOT stored here; they come from live APIs.
"""

STOCKS = [
    # ── TECHNOLOGY ──
    {"sym": "NVDA",   "name": "Nvidia Corp",               "sector": "Technology",   "stars": 5, "target": 175,  "tags": ["AI BOOM", "DATA CENTER"],      "reason": "AI infrastructure supercycle. Blackwell GPU demand exceeds supply through 2026. Data center revenue growing 400%+ YoY."},
    {"sym": "AAPL",   "name": "Apple Inc",                 "sector": "Technology",   "stars": 4, "target": 240,  "tags": ["SERVICES BOOM", "BUYBACKS"],   "reason": "Services revenue at $24B/quarter with 36% margins. Apple Intelligence drives next upgrade supercycle. $90B buyback."},
    {"sym": "MSFT",   "name": "Microsoft Corp",            "sector": "Technology",   "stars": 4, "target": 520,  "tags": ["CLOUD REACCEL", "COPILOT"],    "reason": "Azure reaccelerating +29% YoY driven by OpenAI integration. Copilot enterprise adoption in early innings."},
    {"sym": "META",   "name": "Meta Platforms",            "sector": "Technology",   "stars": 5, "target": 750,  "tags": ["AI TAILWIND", "AD BOOM"],      "reason": "Cheapest mega-cap AI play. Reels monetization scaling. Llama ecosystem moat. 20%+ EPS growth."},
    {"sym": "GOOGL",  "name": "Alphabet Inc",              "sector": "Technology",   "stars": 4, "target": 210,  "tags": ["CHEAP VALUATION", "CLOUD"],    "reason": "Cheapest mega-cap at ~20x PE. Cloud growing 28%+ and profitable. YouTube ad recovery strong."},
    {"sym": "AMZN",   "name": "Amazon.com",                "sector": "Technology",   "stars": 5, "target": 260,  "tags": ["AWS REACCEL", "AD BOOM"],      "reason": "AWS reaccelerating driven by AI workloads. Advertising at $14B/quarter. Retail margins structurally higher."},
    {"sym": "AMD",    "name": "Advanced Micro Devices",    "sector": "Technology",   "stars": 4, "target": 600,  "tags": ["AI CHIPS", "DATA CENTER"],     "reason": "MI300X GPU gaining share. Data center revenue tripling. EPYC Venice on 2nm. Cheaper than NVDA on AI."},
    {"sym": "TSLA",   "name": "Tesla Inc",                 "sector": "Technology",   "stars": 3, "target": 400,  "tags": ["MIXED SIGNALS", "RECOVERY"],   "reason": "FSD progressing. Energy storage +200% QoQ underappreciated. Robotaxi timeline remains the key catalyst."},
    {"sym": "INTC",   "name": "Intel Corp",                "sector": "Technology",   "stars": 2, "target": 100,  "tags": ["TURNAROUND", "SPECULATIVE"],   "reason": "18A node ramp beginning. Still losing market share to AMD/ARM. Turnaround possible but unproven."},
    {"sym": "CRM",    "name": "Salesforce",                "sector": "Technology",   "stars": 4, "target": 340,  "tags": ["AI AGENTS", "FCF GROWTH"],     "reason": "Agentforce AI driving new ARR. $10B buyback. Profitability inflection ahead of consensus."},
    {"sym": "ORCL",   "name": "Oracle Corp",               "sector": "Technology",   "stars": 4, "target": 220,  "tags": ["CLOUD INFRA", "AI DATA"],      "reason": "OCI cloud winning AI workloads. GPU cluster bookings at record. Database migration tailwinds."},
    {"sym": "SNOW",   "name": "Snowflake",                 "sector": "Technology",   "stars": 3, "target": 220,  "tags": ["DATA CLOUD", "RECOVERY"],      "reason": "Consumption model recovering. Cortex AI differentiated. High valuation caps near-term upside."},
    {"sym": "PLTR",   "name": "Palantir Technologies",     "sector": "Technology",   "stars": 4, "target": 180,  "tags": ["AI PLATFORM", "GOVT"],         "reason": "AIP adoption accelerating. US commercial revenue +70% YoY. Government backlog growing."},
    {"sym": "TSM",    "name": "TSMC",                      "sector": "Technology",   "stars": 5, "target": 260,  "tags": ["FOUNDRY MONOPOLY", "AI CHIPS"],"reason": "Sole advanced semiconductor manufacturer. 3nm/2nm demand exceeds capacity. NVDA, AAPL, AMD all dependent."},
    {"sym": "AVGO",   "name": "Broadcom Inc",              "sector": "Technology",   "stars": 5, "target": 550,  "tags": ["CUSTOM AI CHIPS", "VMWARE"],   "reason": "Custom AI ASICs (XPUs) for Google, Meta, Apple — $10B+ revenue. VMware integration ahead of consensus."},
    {"sym": "QCOM",   "name": "Qualcomm",                  "sector": "Technology",   "stars": 4, "target": 300,  "tags": ["ON-DEVICE AI", "AI PCS"],      "reason": "Snapdragon for AI PCs. ByteDance order confirms AI chip demand. Hit all-time high recently."},
    {"sym": "MU",     "name": "Micron Technology",         "sector": "Technology",   "stars": 5, "target": 1100, "tags": ["HBM MEMORY", "AI DRAM"],       "reason": "HBM3 memory for AI GPUs — just hit $1T market cap. DRAM pricing cycle turning structurally bullish."},
    {"sym": "MSTR",   "name": "MicroStrategy",             "sector": "Technology",   "stars": 3, "target": 500,  "tags": ["BITCOIN PROXY", "VOLATILE"],   "reason": "Bitcoin proxy at premium. $14B+ BTC holdings. High volatility — not for risk-averse investors."},
    # ── HEALTHCARE ──
    {"sym": "LLY",    "name": "Eli Lilly",                 "sector": "Healthcare",   "stars": 5, "target": 1050, "tags": ["GLP-1 LEADER", "ALZHEIMERS"],  "reason": "GLP-1 leader. Mounjaro revenue +200% YoY. Donanemab Alzheimer's approval adds $10B+ revenue stream."},
    {"sym": "NVO",    "name": "Novo Nordisk",              "sector": "Healthcare",   "stars": 4, "target": 95,   "tags": ["GLP-1 DUOPOLY", "OBESITY"],    "reason": "Ozempic/Wegovy GLP-1 duopoly with LLY. CagriSema trial data upcoming catalyst."},
    {"sym": "UNH",    "name": "UnitedHealth Group",        "sector": "Healthcare",   "stars": 3, "target": 320,  "tags": ["DEFENSIVE", "REGULATORY"],     "reason": "Largest US insurer with Optum services. Under regulatory scrutiny. Predictable FCF if headwinds clear."},
    {"sym": "ABBV",   "name": "AbbVie",                    "sector": "Healthcare",   "stars": 4, "target": 220,  "tags": ["DIVIDEND", "PIPELINE"],        "reason": "Humira biosimilar headwind absorbed. Skyrizi + Rinvoq filling gap faster than expected. 3.5% yield."},
    {"sym": "MRNA",   "name": "Moderna",                   "sector": "Healthcare",   "stars": 1, "target": 30,   "tags": ["AVOID", "POST-COVID"],         "reason": "Post-COVID revenue cliff. mRNA pipeline unproven beyond COVID. Cash burn unsustainable. Avoid."},
    {"sym": "ISRG",   "name": "Intuitive Surgical",        "sector": "Healthcare",   "stars": 4, "target": 620,  "tags": ["ROBOTIC SURGERY", "MOAT"],     "reason": "Robotic surgery monopoly. Da Vinci install base drives recurring revenue. International expansion."},
    {"sym": "REGN",   "name": "Regeneron Pharma",          "sector": "Healthcare",   "stars": 3, "target": 800,  "tags": ["DUPIXENT", "PIPELINE"],        "reason": "Dupixent blockbuster growing 20%+ YoY. Eylea biosimilar headwind near-term. Pipeline deep."},
    {"sym": "GILD",   "name": "Gilead Sciences",           "sector": "Healthcare",   "stars": 3, "target": 130,  "tags": ["HIV FRANCHISE", "LENACAPAVIR"],"reason": "HIV franchise durable. Lenacapavir could be transformative for HIV prevention. Cheap but lacks catalyst."},
    # ── FINANCIALS ──
    {"sym": "JPM",    "name": "JPMorgan Chase",            "sector": "Financials",   "stars": 4, "target": 340,  "tags": ["VALUE", "HIGH NII"],           "reason": "Best-in-class bank. NII at cycle high. IB revenue rebounding. Only 11x PE — historically cheap."},
    {"sym": "BRK-B",  "name": "Berkshire Hathaway B",      "sector": "Financials",   "stars": 4, "target": 550,  "tags": ["VALUE FORTRESS", "CASH HOARD"],"reason": "$168B cash war chest ready to deploy. Insurance float + energy + rails diversification."},
    {"sym": "V",      "name": "Visa Inc",                  "sector": "Financials",   "stars": 4, "target": 420,  "tags": ["TOLL ROAD", "HIGH MARGIN"],    "reason": "Toll road on global commerce. Cross-border volume +16% YoY. Asset-light, 50%+ FCF margins."},
    {"sym": "GS",     "name": "Goldman Sachs",             "sector": "Financials",   "stars": 3, "target": 650,  "tags": ["IB RECOVERY", "CYCLICAL"],     "reason": "IB cyclical rebound underway. Asset management growing. Hold."},
    {"sym": "PYPL",   "name": "PayPal Holdings",           "sector": "Financials",   "stars": 2, "target": 60,   "tags": ["TURNAROUND", "CHEAP"],         "reason": "Apple Pay eroding share. New CEO needs time to prove turnaround. Cheap but value trap risk."},
    {"sym": "COIN",   "name": "Coinbase Global",           "sector": "Financials",   "stars": 3, "target": 300,  "tags": ["CRYPTO", "REGULATORY"],        "reason": "Crypto exchange leader. Spot ETF approval increases institutional flow. Regulatory clarity improving."},
    # ── CONSUMER ──
    {"sym": "COST",   "name": "Costco Wholesale",          "sector": "Consumer",     "stars": 4, "target": 1150, "tags": ["MEMBERSHIP", "PRICING POWER"], "reason": "92.9% membership renewal rate. Membership fee hike sticking. Premium valuation deserved for quality."},
    {"sym": "MCD",    "name": "McDonald's Corp",           "sector": "Consumer",     "stars": 3, "target": 310,  "tags": ["FRANCHISE", "DEFENSIVE"],      "reason": "Franchise model, 95% franchised. Digital/loyalty 25%+ of sales. Resilient in downturns."},
    {"sym": "SBUX",   "name": "Starbucks Corp",            "sector": "Consumer",     "stars": 2, "target": 70,   "tags": ["TURNAROUND", "WAIT"],          "reason": "China recovery slower than expected. US traffic declining. New CEO Brian Niccol execution unproven."},
    {"sym": "NKE",    "name": "Nike Inc",                  "sector": "Consumer",     "stars": 2, "target": 50,   "tags": ["WAIT", "CHINA DRAG"],          "reason": "China demand weak. DTC pivot creating channel conflict. Inventory issues persisting. Wait."},
    {"sym": "LULU",   "name": "Lululemon Athletica",       "sector": "Consumer",     "stars": 3, "target": 380,  "tags": ["BRAND POWER", "INTL GROWTH"],  "reason": "Brand strong but US growth slowing. International becoming critical growth driver."},
    # ── INDUSTRIALS ──
    {"sym": "CAT",    "name": "Caterpillar Inc",           "sector": "Industrials",  "stars": 3, "target": 430,  "tags": ["INFRASTRUCTURE", "CYCLICAL"],  "reason": "Infrastructure spending cycle supports demand. Services revenue growing. Cyclical risk if GDP slows."},
    {"sym": "DE",     "name": "Deere & Company",           "sector": "Industrials",  "stars": 3, "target": 460,  "tags": ["AG CYCLE", "QUALITY"],         "reason": "Precision ag slowdown. Farmer income under pressure. High-quality cyclical — wait for earnings trough."},
    {"sym": "HON",    "name": "Honeywell Intl",            "sector": "Industrials",  "stars": 4, "target": 260,  "tags": ["AEROSPACE", "AUTOMATION"],     "reason": "Aerospace cycle. Automation and process control durable tailwinds. Portfolio simplification creating value."},
    {"sym": "WM",     "name": "Waste Management",          "sector": "Industrials",  "stars": 4, "target": 260,  "tags": ["MONOPOLY", "PRICING POWER"],   "reason": "Monopoly-like local waste collection. 3-4% annual pricing power. RNG from landfills = ESG upside."},
    # ── DEFENSE ──
    {"sym": "LMT",    "name": "Lockheed Martin",           "sector": "Defense",      "stars": 4, "target": 640,  "tags": ["F-35", "RECORD BACKLOG"],      "reason": "F-35 program — $1.7T lifetime value. Record backlog $156B. Hypersonics next catalyst. 2.7% dividend."},
    {"sym": "NOC",    "name": "Northrop Grumman",          "sector": "Defense",      "stars": 4, "target": 650,  "tags": ["B-21 BOMBER", "NUCLEAR"],      "reason": "B-21 Raider stealth bomber contract. Space and nuclear modernization. Strong backlog."},
    {"sym": "GD",     "name": "General Dynamics",          "sector": "Defense",      "stars": 4, "target": 400,  "tags": ["SUBMARINES", "GULFSTREAM"],    "reason": "Gulfstream jets + Virginia-class submarine backlog 3x annual revenue. Solid compounder."},
    {"sym": "RTX",    "name": "RTX Corp",                  "sector": "Defense",      "stars": 4, "target": 220,  "tags": ["DEFENSE", "GTF ENGINE"],       "reason": "Defense spending rising globally. Pratt & Whitney GTF engine ramping. Record $206B backlog."},
    {"sym": "BA",     "name": "Boeing Co",                 "sector": "Defense",      "stars": 2, "target": 180,  "tags": ["AVOID", "QUALITY CRISIS"],     "reason": "737 MAX quality crisis unresolved. FAA scrutiny ongoing. Cash burn concerning. Avoid."},
    {"sym": "HII",    "name": "Huntington Ingalls",        "sector": "Defense",      "stars": 4, "target": 360,  "tags": ["NAVY MONOPOLY", "AUKUS"],      "reason": "Only US builder of nuclear-powered aircraft carriers. AUKUS submarine deal adds decade of backlog."},
    # ── ENERGY ──
    {"sym": "XOM",    "name": "ExxonMobil",                "sector": "Energy",       "stars": 3, "target": 130,  "tags": ["OIL", "DIVIDEND"],             "reason": "Pioneer deal integration on track. Oil at $76/bbl weighs near-term. 40+ year dividend aristocrat."},
    {"sym": "CVX",    "name": "Chevron Corp",              "sector": "Energy",       "stars": 3, "target": 175,  "tags": ["BUYBACK", "PERMIAN"],          "reason": "Strong Permian position. $75B buyback over 5 years. Cheap at ~12x PE."},
    {"sym": "ENPH",   "name": "Enphase Energy",            "sector": "Energy",       "stars": 2, "target": 55,   "tags": ["WAIT", "RATE SENSITIVE"],      "reason": "Solar slowdown persists. Rate sensitivity hurting residential demand. Wait for Fed cuts."},
    {"sym": "NEE",    "name": "NextEra Energy",            "sector": "Energy",       "stars": 4, "target": 65,   "tags": ["RENEWABLES", "AI POWER"],      "reason": "Largest US renewable energy producer. AI data center power demand is a massive new customer base."},
    # ── REAL ESTATE ──
    {"sym": "EQIX",   "name": "Equinix",                   "sector": "Real Estate",  "stars": 4, "target": 1100, "tags": ["DATA CENTER REIT", "AI"],      "reason": "Data center REIT with interconnection moat. AI demand driving unprecedented pre-leasing."},
    {"sym": "PLD",    "name": "Prologis",                  "sector": "Real Estate",  "stars": 3, "target": 130,  "tags": ["INDUSTRIAL REIT", "LOGISTICS"], "reason": "Industrial REIT leader. E-commerce logistics + data center land conversion optionality."},
    {"sym": "AMT",    "name": "American Tower",            "sector": "Real Estate",  "stars": 3, "target": 220,  "tags": ["5G TOWERS", "RATE SENSITIVE"], "reason": "Cell tower REIT. 5G densification + international growth. Improving as rate cuts approach."},
    # ── COMMUNICATION ──
    {"sym": "NFLX",   "name": "Netflix",                   "sector": "Communication","stars": 4, "target": 1400, "tags": ["SUB GROWTH", "AD TIER"],       "reason": "Password sharing crackdown adding subscribers. Ad-supported tier scaling. Pricing power proved."},
    {"sym": "DIS",    "name": "Walt Disney Co",            "sector": "Communication","stars": 2, "target": 90,   "tags": ["RESTRUCTURING", "CAUTION"],    "reason": "Streaming improving but linear TV declining fast. Parks pricing near ceiling. Execution risk."},
    {"sym": "SPOT",   "name": "Spotify Technology",        "sector": "Communication","stars": 4, "target": 800,  "tags": ["PROFITABILITY", "AUDIO"],      "reason": "First profitable year. Podcast + audiobooks expanding TAM. Price increases sticking."},
    # ── MATERIALS ──
    {"sym": "LIN",    "name": "Linde plc",                 "sector": "Materials",    "stars": 4, "target": 570,  "tags": ["INDUSTRIAL GAS", "HYDROGEN"],  "reason": "Industrial gas duopoly. Hydrogen economy positioning. 30+ year dividend growth record."},
    {"sym": "FCX",    "name": "Freeport-McMoRan",          "sector": "Materials",    "stars": 3, "target": 58,   "tags": ["COPPER", "ELECTRIFICATION"],   "reason": "Largest copper producer. Electrification + AI data centers driving structural copper demand."},
]

# Symbols list (preserving order)
SYMBOLS = [s["sym"] for s in STOCKS]

# Lookup by symbol
STOCK_MAP = {s["sym"]: s for s in STOCKS}
