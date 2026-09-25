# MSME CreditOS -- Developer Knowledge Transfer & Quickstart Guide

> **Project:** MSME CreditOS  
> **Status:** Live Prototype / Active Handover  
> **Frontend:** React 19 (Vite + Tailwind CSS v4) | Hosted on Vercel  
> **Backend:** Express.js (Node 18+) | Hosted on Render  
> **Target Production:** AWS Mumbai (`ap-south-1`) at Rs. 11,550/mo (See Document 07)

---

## 1. Project Overview & Core Mission

### 1.1 What is MSME CreditOS?
**MSME CreditOS** is an automated credit intelligence, financial statement spreading, and underwriting platform designed specifically for Indian Micro, Small, and Medium Enterprises (MSMEs). 

It bridges the gap between raw borrower accounting documents (CA-prepared balance sheets, P&L statements, Tally ledgers) and formal institutional credit, translating messy unstandardized financials into bank-grade credit assessments in **under 60 seconds**.

### 1.2 The Real-World Problem It Solves
* **The Manual Bottleneck:** Over 95% of Indian MSMEs are non-corporate entities (Sole Proprietorships, Partnerships). They do not file standardized MCA Schedule III corporate reports; instead, they operate on non-standard horizontal "T-format" CA statements and paper scans.
* **The Lending Delay:** Traditional banks and NBFCs take **3 to 4 weeks** to manually type figures into spreadsheets, analyze debtor ageing, and compute working capital eligibility. This delay forces healthy MSMEs into high-interest informal debt (24% to 36% p.a.).

### 1.3 How CreditOS Works End-to-End
```
   [ Borrower Accounting Files ]  (CA Excel .xlsx, Tally Exports, Scanned PDFs/Photos)
                 │
                 ▼
   [ Automated Ingestion Engine]  (Direct Python Parser for Excel + In-Region Vision AI for Scans)
                 │
                 ▼
   [ Underwriting & Spreading  ]  (Nayak Committee 20% Norm, DSCR, CCC Days, Drawing Power Erosion)
                 │
                 ▼
   [ CreditOS Portal & Matching]  (Interactive Health Score 0-900, Diagnostics & Bank CC/OD/TReDS Routes)
```

1. **Ingestion & Spreading:** Extracts data directly from digital files (Excel/Tally) with 100% precision, or uses spatial Vision AI on paper scans with double-entry checksums (`Liabilities == Assets`).
2. **Underwriting Intelligence:** Automatically computes statutory **Nayak Committee Working Capital limits** (minimum 20% of turnover), debt service capacity (DSCR), and flags high-risk receivables (>90 days) eroding bank drawing power.
3. **Borrower Experience:** Generates a real-time **Credit Health Score (0-900)** and matches the business with the most suitable financing routes (**Bank CC/OD limits, CGTMSE collateral-free loans, or TReDS invoice discounting**).

---

## 2. Quickstart: Running Locally in 2 Minutes

### Prerequisites
* **Node.js**: v18+ LTS
* **npm**: v9+

### Terminal 1: Backend API
```bash
cd server
npm install
npm run dev
# Server binds to http://localhost:5000
# Verify: curl http://localhost:5000/api/health
```

### Terminal 2: Frontend Client
```bash
cd client
npm install
npm run dev
# App runs at http://localhost:5173
```

### Environment Variables
* **Client (`client/.env`):**
  ```env
  VITE_API_URL=http://localhost:5000
  ```
  *(If omitted, defaults automatically to `http://localhost:5000` via `client/src/config/api.js`).*
* **Server (`server/.env`):**
  ```env
  PORT=5000
  NODE_ENV=development
  CLIENT_URL=http://localhost:5173
  ```

---

## 3. Ground Reality: What Is Working vs. What Is Mocked

To save you time digging through code, here is the exact operational status of each module today:

| Feature / Module | Status | Where It Lives | Notes for Next Developer |
| :--- | :--- | :--- | :--- |
| **All 7 Screen Flows** | **100% Functional** | `client/src/screens/` | Navigation, back/forward steps, and reset buttons work seamlessly. |
| **Form Inputs & Profile State** | **100% Functional** | `ProfileScreen.jsx` | Controlled inputs; updates global context and carries to Dashboard. |
| **Working Capital Calculations** | **100% Functional** | `DetailsScreen.jsx` | Nayak 20% limit, deficit gap, and CCC days are dynamically calculated. |
| **Dynamic Credit Gauge** | **100% Functional** | `ScoreGauge.jsx` | SVG-based radial gauge responding to the 0-900 score band. |
| **Backend Health Check & CORS** | **100% Functional** | `server/index.js` | Cloud-hardened, graceful shutdown, allows Vercel and localhost. |
| **Document Upload Pipeline** | **Simulated / Mocked** | `UploadScreen.jsx` | Accepts file drag-and-drop, but currently uses mock fixtures on submit. |
| **Processing Animation** | **Simulated / Mocked** | `ProcessingScreen.jsx` | Runs a 3.5s timeout animation simulating OCR/scoring, then redirects. |
| **Financial Data Source** | **Mock Fixture** | `client/src/mockData.js` | Uses real ground-truth data from CA-audited sample (Amy Group). |
| **Database (PostgreSQL)** | **Not Yet Connected** | N/A | Server does not have database drivers or ORM installed yet. |

---

## 4. Codebase Map: Where Everything Lives

```
Finance Project/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AppHeader.jsx          # Header with progress stepper, profile pill, and dev reset
│   │   │   ├── MetricCard.jsx         # KPI card with status indicators
│   │   │   ├── ScoreGauge.jsx         # Radial credit score arc (0-900)
│   │   │   ├── Badge.jsx              # Status badges (Success, Warning, Danger, Info)
│   │   │   └── RecommendationCard.jsx # Loan scheme card with eligibility tags
│   │   ├── screens/
│   │   │   ├── LandingScreen.jsx      # Hero section, feature walkthrough, CTA
│   │   │   ├── ProfileScreen.jsx      # Business onboarding (Entity, GSTIN, PAN, Turnover)
│   │   │   ├── UploadScreen.jsx       # Document dropzone + "Load Sample Files" button
│   │   │   ├── ProcessingScreen.jsx   # Animated 4-step pipeline simulator
│   │   │   ├── DashboardScreen.jsx    # Executive credit health score & summary metrics
│   │   │   ├── DetailsScreen.jsx      # Deep-dive: CCC diagnostics, Nayak limit, Debtors
│   │   │   └── RecommendationsScreen.jsx # Loan routes (Bank CC/OD, CGTMSE, TReDS)
│   │   ├── context/
│   │   │   └── CreditOSContext.jsx    # Global React state (businessProfile, ratios, workingCapital)
│   │   ├── config/
│   │   │   └── api.js                 # API URL resolver (handles local dev vs Vercel/Render)
│   │   ├── mockData.js                # Default ground-truth financial fixture
│   │   ├── App.jsx                    # Screen router, toast notifications, dev toolbar
│   │   └── main.jsx                   # React 19 entry point
│   └── vercel.json                    # SPA routing rewrite (prevents 404 on refresh)
├── server/
│   ├── index.js                       # Express REST server, CORS handler, /api/health
│   └── package.json                   # ES Modules ("type": "module")
├── render.yaml                        # Render Blueprint for automated backend deployment
└── KNOWLEDGE_TRANSFER.md              # This guide
```

---

## 5. Financial Calculations in Code (Where to Edit Formulas)

All banking and underwriting formulas live in the frontend. When adjusting policies or thresholds, edit these files:

### 5.1 Nayak Committee Working Capital Norm
* **File:** `client/src/screens/DetailsScreen.jsx`
* **Formula:**
  ```javascript
  // Statutory RBI Turnover Method for MSMEs
  const nayakLimit = turnover * 0.20;       // 20% minimum bank finance
  const borrowerMargin = turnover * 0.05;   // 5% promoter equity contribution
  const deficitGap = Math.max(0, nayakLimit - existingLimit); // Additional limit borrower can demand
  ```

### 5.2 Cash Conversion Cycle (CCC)
* **File:** `client/src/screens/DetailsScreen.jsx`
* **Formula:**
  ```javascript
  const cccDays = debtorDays + inventoryDays - creditorDays; // DSO + DIO - DPO
  // <45 days = Excellent (Green) | 45-90 days = Standard (Amber) | >90 days = Cash trapped (Red)
  ```

### 5.3 Sundry Debtors Drawing Power (DP) Erosion
* **File:** `client/src/screens/DetailsScreen.jsx`
* **Formula:**
  ```javascript
  // Banks exclude debtors >90 days when calculating CC limit drawing power
  const dpErosionPercent = (debtorsAbove90Days / totalDebtors) * 100;
  ```

---

## 6. Deployment Setup

### Current Staging Pipeline
1. **Frontend (Vercel):**
   * Connected to repository `main` branch.
   * Root directory set to `client`.
   * SPA rewrites configured via `client/vercel.json` (all routes redirect to `index.html`).
   * Environment variable: `VITE_API_URL` set to Render backend URL.
2. **Backend (Render):**
   * Configured via root `render.yaml`.
   * Root directory set to `server`.
   * Build command: `npm install` | Start command: `npm start`.
   * Health check path: `/api/health`.

### Target Production (AWS Mumbai)
* Fully audited budget: **Rs. 11,550 / month** (Lean Live Pilot tier on AWS Mumbai `ap-south-1`).
* Architecture: 1x `t4g.small` ARM app instance, 1x `db.t4g.micro` Multi-AZ RDS PostgreSQL 16, ALB, and CloudFront.
* *For exact server configs and line-by-line pricing, see `07_AWS_Server_Specifications.pdf`.*

---

## 7. What to Build Next: Immediate Tasks for the Next Developer

Here are the top 3 priorities to move from the current prototype to live production:

### Priority 1: Build the Native Excel Parser Endpoint (Zero-OCR)
* **Why:** In India, CAs create balance sheets directly in Excel (`.xlsx`). Reading Excel directly with Python (`openpyxl`) or Node.js (`xlsx`) provides 100% mathematical precision with zero OCR latency and zero cost.
* **Task:** Create `POST /api/upload/excel` in `server/index.js` that parses:
  * Left columns: Liabilities & Capital.
  * Right columns: Assets & Cash/Bank.
  * Extract: Turnover, Net Profit, Mudra/Bank Borrowings, Sundry Debtors.

### Priority 2: Connect Frontend to Backend (Replace Mock Timeout)
* **File to modify:** `client/src/screens/ProcessingScreen.jsx`
* **Task:** Replace the simulated `setTimeout` in `ProcessingScreen.jsx` with an actual `fetch()` call to the backend upload endpoint using `client/src/config/api.js`.

### Priority 3: Set up PostgreSQL Database
* **Task:**
  1. Add `pg` (node-postgres) or Prisma to `server/package.json`.
  2. Create tables: `borrowers`, `financial_statements`, `ratios`.
  3. Store the extracted data so underwriting reports persist across user sessions.

---

## 8. Reference Specifications (The 4 Handover PDFs)

For deeper business, infrastructure, and compliance context, consult the 4 finalized specifications located in the `MSME_CreditOS_Handover_Package` folder:

1. **`09A_Financial_Statement_OCR_Executive_Brief.pdf`**:
   * Evaluates Perfios vs. Vision AI vs. Zero-OCR Excel ingestion, including the double-entry accounting checksum (`Liabilities == Assets`).
2. **`09B_Financial_Statement_OCR_Technical_and_Compliance_DeepDive.pdf`**:
   * Technical & compliance deep-dive covering RBI Outsourcing Directions 2025, DPDP Act, document fraud detection, and PostgreSQL DDL.
3. **`07_AWS_Server_Specifications.pdf`**:
   * The audited AWS Mumbai infrastructure and server configuration (Lean Live Pilot at Rs. 11,550/mo).
4. **`08_LoanDoctor_Features_and_Functionality.pdf`**:
   * Competitive teardown of `loandoctor.in`, including the LDRI credit rating model and government MSME subsidy schemes (PMEGP, Interest Subvention).

---
*End of Developer Knowledge Transfer Guide. The codebase is clean, runs out of the box, and is ready for backend integration.*
