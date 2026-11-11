# MoneyLend Pro 🚀

A **production-ready, full-stack Money Lending Business Automation Web App** designed specifically for microfinance lenders, NBFCs, pawnshops, and private lenders. Built 100% on **Cloudflare's FREE tier** (no credit card required) with zero paid service dependencies.

---

## 🌟 Highlights

- **100% Free Tier Stack**: Cloudflare Pages + Workers + D1 (SQLite) + KV Sessions.
- **WhatsApp Automation**: Instant `wa.me` deep links for upcoming EMIs, due today, and overdue debts. Zero API fees or Meta verification hurdles.
- **Smart Financial Engine**: Accurate simple interest, flat rate, and reducing-balance EMI calculation with full month-by-month amortization schedules.
- **Modern Responsive UI/UX**: Mobile-first design, dark/light mode toggle with persistence, keyboard shortcuts (`N`, `L`, `P`, `R`, `D`, `/`), and fast search.
- **PWA Ready**: Offline support with Service Worker (`sw.js`) and Web App Manifest (`manifest.json`). Works seamlessly even without an active internet connection.
- **Executive Analytics**: Real-time portfolio stat cards, Chart.js visualizations, Defaulter reports, Collection ledgers, and one-click CSV export.

---

## 📁 Project Structure

```
/
├── index.html              # Single-page application entry point
├── style.css               # Comprehensive theme & layout stylesheet
├── app.js                  # SPA router, reactive state store, hybrid API/offline engine
├── _worker.js              # Cloudflare Pages advanced worker entry point
├── api/
│   ├── _worker.js          # Hono router entrypoint with Cron handler
│   ├── auth.js             # Session login/logout endpoints
│   ├── customers.js        # Customer CRUD with loan summary enrichment
│   ├── loans.js            # Loan issuance, schedule generation, & balances
│   ├── payments.js         # Payment recording & loan balance recalculation
│   ├── reminders.js        # Due date detection, wa.me links, & cron tasks
│   ├── calculations.js     # Pure math financial algorithms & schedules
│   ├── reports.js          # Dashboard analytics, P&L, & defaulter reports
│   ├── settings.js         # Business profile & WhatsApp template settings
│   ├── db.js               # Async SQLite query helpers for D1
│   └── utils.js            # Server-side formatting & date utilities
├── public/
│   ├── manifest.json       # PWA manifest with shortcuts
│   └── sw.js               # Service Worker for offline asset caching
├── schema.sql              # D1 database schema with indexes
├── seed.sql                # Default business settings & sample borrowers
├── wrangler.toml           # Cloudflare deployment configuration
├── package.json            # Scripts & dependencies (Hono, Wrangler)
└── README.md               # Complete setup and deployment documentation
```

---

## 🧮 Financial Calculation Standards

1. **Reducing Balance EMI**:
   $$\text{Monthly Rate } r = \frac{\text{Annual Rate}}{100 \times 12}$$
   $$\text{EMI} = P \times r \times \frac{(1+r)^n}{(1+r)^n - 1}$$
2. **Flat Interest**:
   $$\text{Total Interest} = \frac{P \times R \times T}{100 \times 12}, \quad \text{EMI} = \frac{P + \text{Total Interest}}{T}$$
3. **Late Fees**: Calculated on overdue principal/EMI upon grace period expiry.
4. **FIFO Allocation**: Payments reduce overdue late fees $\to$ interest $\to$ principal $\to$ next cycle.

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js 18+ installed
- Wrangler CLI (`npm install -g wrangler` or use the local devDependency)

### 2. Install Dependencies
```bash
npm install
```

### 3. Initialize Local D1 Database
```bash
npm run db:local
wrangler d1 execute money-lending-db --local --file=seed.sql
```

### 4. Run Development Server
```bash
# Serves both frontend static assets and backend API worker
npm run dev
```
Open **`http://localhost:8788`** in your browser.

> **Offline / Direct Browser Preview**: You can also open `index.html` directly in any modern browser! The built-in client engine automatically handles mock data in `localStorage` so all forms, EMI previews, and buttons function fluently out of the box.

---

## 🌐 Production Deployment to Cloudflare (Free Tier)

### Step 1: Create GitHub Repository
```bash
git init
git add .
git commit -m "Initial commit: Money Lending App"
# Push to your GitHub repository
```

### Step 2: Create D1 Database on Cloudflare
```bash
wrangler d1 create money-lending-db
```
*Copy the generated `database_id` and paste it into `wrangler.toml` under `[[d1_databases]]`.*

### Step 3: Create KV Session Namespace
```bash
wrangler kv:namespace create SESSIONS
wrangler kv:namespace create SESSIONS --preview
```
*Copy both `id` and `preview_id` into `wrangler.toml` under `[[kv_namespaces]]`.*

### Step 4: Run Migrations on Cloudflare
```bash
wrangler d1 execute money-lending-db --remote --file=schema.sql
wrangler d1 execute money-lending-db --remote --file=seed.sql
```

### Step 5: Deploy to Cloudflare Pages
```bash
wrangler pages deploy . --project-name=money-lending-app
```
Or link your GitHub repository directly in the Cloudflare Dashboard under **Workers & Pages** $\to$ **Create Application** $\to$ **Pages** (Build output directory: `.`).

---

## 📲 WhatsApp Automation

The application uses direct **`wa.me` deep links**:
- **Due Soon Reminders**: Sent 3 days before payment date.
- **Due Today**: Triggered on installment due day.
- **Overdue Notice**: Alerts with days late and late fee summary.
- **Payment Confirmation**: Instant receipt acknowledgment with loan balance.

All templates can be customized from the **Settings** view with dynamic variables:
- `{{customer_name}}`
- `{{loan_id}}`
- `{{emi}}`
- `{{amount}}`
- `{{due_date}}`
- `{{days_overdue}}`
- `{{business_name}}`

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|:---:|:---|
| `N` | Register New Customer |
| `L` | Disburse New Loan |
| `P` | Record Payment |
| `R` | View WhatsApp Reminders |
| `D` | Go to Dashboard |
| `/` | Focus Global Search |
| `Esc` | Close Active Modal |

---

## 🛡️ License & Compliance

MIT License. Designed with WCAG 2.1 AA accessibility guidelines, sanitized inputs, parameterized SQLite statements, and responsive mobile-first UI.
