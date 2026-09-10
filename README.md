# MSME CreditOS

**MSME CreditOS** is an automated credit intelligence and underwriting engine for Indian micro, small, and medium enterprises. It translates raw Tally accounting data (P&L statements, balance sheets, debtor/creditor ageing ledgers) into bank-grade credit assessments, Nayak Committee Working Capital norms, and institutional financing pathways.

---

## Architecture Overview

```
Finance Project/
├── client/                 # Vite + React 19 SPA (Tailwind CSS v4, Lucide Icons)
│   ├── src/
│   │   ├── components/     # AppHeader, MetricCard, ScoreGauge, Badge, Footer
│   │   ├── context/        # CreditOSContext (state & session management)
│   │   ├── screens/        # Landing, Profile, Upload, Processing, Dashboard, Details, Recommendations
│   │   └── config/         # Universal API client & environment resolver
│   └── vercel.json         # SPA routing rewrites for Vercel CDN deployment
├── server/                 # Express.js API engine
│   ├── index.js            # Cloud-hardened REST server, CORS handler, /api/health check
│   └── package.json        # Server dependencies
└── render.yaml             # Render Blueprint specification for automated backend deployment
```

---

## Features

- **Automated Underwriting Ratios**: Computes DSCR, Interest Coverage Ratio (ICR), Current Ratio, Debt-to-Equity, and EBITDA margins.
- **Nayak Committee Working Capital Engine**: Automatically computes the minimum 20% permissible bank finance (PBF) and flags working capital deficit gaps.
- **Cash Conversion Cycle (CCC) Diagnostics**: Interactive breakdown of Debtor Days (DSO) + Inventory Days (DIO) − Creditor Days (DPO).
- **Sundry Debtors Ageing Classification**: Visual concentration bars highlighting debts >90 days and estimating Bank Drawing Power (DP) erosion.
- **Financing Route Matching**: Categorized pathways across Bank CC/OD limits, TReDS Invoice Discounting (RXIL/M1xchange), and CGTMSE collateral-free term loans.

---

## Local Development

### Prerequisites
- Node.js 18+
- npm

### 1. Run the Backend API
```bash
cd server
npm install
npm run dev
# Server runs on http://localhost:5000
```

### 2. Run the Frontend Client
```bash
cd client
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

---

## Production Deployment

### Backend on Render
1. In the [Render Dashboard](https://dashboard.render.com), click **New +** -> **Web Service**.
2. Connect this repository and configure:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
3. Deploy and copy your production service URL (e.g., `https://msme-creditos-api.onrender.com`).

### Frontend on Vercel
1. In the [Vercel Dashboard](https://vercel.com/new), select this repository.
2. In Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
3. Under **Environment Variables**:
   - `VITE_API_URL` = `<your-render-backend-url>`
4. Deploy. Vercel automatically handles routing rewrites via `client/vercel.json`.

---

## License
MIT
