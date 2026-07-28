# 🏦 Personal Financial Tracker v2 (Local-First & Multi-Vault)

A modern, high-performance, **local-first personal finance and expense tracking web application** built with FastAPI, Vue 3, Vite, SQLModel, and SQLite.

Designed for complete data ownership and zero-friction setup: your financial data remains 100% local, private, and portable.

---

## 🌟 Key Features

- **🚀 1-Command Startup**: Start both the FastAPI backend and Vue 3 frontend simultaneously with `npm run dev`.
- **🏛️ Obsidian-Style Financial Vaults**: Manage multiple isolated database files (`Personal.db`, `Freelance.db`, `Family.db`) and switch between them dynamically in 1 click.
- **⚡ Automatic Database Creation & Migrations**: Zero manual SQL setup. The application automatically creates `data/finance.db`, runs Alembic migrations (`alembic upgrade head`), and seeds default categories on first launch.
- **🪣 Dual-Dimension Savings Buckets**: Track **where** your money is stored (Bank Accounts, Cash, Wallet) independently of **why** your money exists (Emergency Fund, Japan Trip, Rent, Investments).
- **📊 Dynamic Analytics & Filtering**: Real-time spending breakdown pie charts, monthly time-range selectors, multi-category filtering, and debt tracking.
- **💾 Export, Import & Snapshots**: 1-click database exports, timestamped local snapshots (`backups/`), and seamless database restoration.
- **🔒 Privacy First & Portable**: 100% local-first SQLite architecture. No third-party data tracking or external cloud lock-in.

---

## 🛠️ Prerequisites

Before getting started, ensure you have the following installed on your machine:

- **Python**: `v3.10` or higher
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher

---

## 🚀 Quick Start (1-Command Launch)

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd financial-tracking-app-v2
```

### 2. Install Dependencies

Install root and frontend dependencies with a single command:

```bash
npm run install:all
```

*(Optionally install Python dependencies into a virtual environment):*

```bash
python -m venv backend/.venv

# Windows PowerShell:
.\backend\.venv\Scripts\Activate.ps1

# macOS / Linux:
source backend/.venv/bin/activate

pip install -r backend/requirements.txt
```

### 3. Run the Development Server

Start both backend (FastAPI @ `http://localhost:8000`) and frontend (Vite @ `http://localhost:5173`) with **one command**:

```bash
npm run dev
```

Open **`http://localhost:5173`** in your browser. The database and schema will be initialized automatically!

---

## 🏛️ Financial Vaults (Multi-Database System)

Just like **Obsidian Vaults**, this application supports managing multiple completely independent database files:

- **Switching Vaults**: Click the **`🏦 Vault: Personal ▾`** pill button in the top navigation header to open the Vault Manager modal and switch vaults instantly.
- **Creating a Vault**: Enter a name (e.g. *Freelance*, *Family*) and click **+ Create Vault**. A new SQLite file will be created in `data/`, migrated to the latest schema, and initialized with defaults.
- **Importing a Vault**: Select an existing `.db` file from your machine to import it as a new vault without overwriting your current data.

---

## 💾 Backup, Export & Restore

### Export Active Database
- Navigate to **Settings** -> **Data Backup & Export Controls**.
- Click **⬇️ Export Active Database** to download your current SQLite database file.

### Snapshot Backups
- Click **📸 Create Local Snapshot** in Settings to save a timestamped copy (e.g. `backup_finance_20260728_150000.db`) into the `backups/` directory.
- Click **Restore** next to any snapshot to revert to that state.

---

## 📁 Repository Structure

```text
financial-tracking-app-v2/
│
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── api/              # REST Endpoints (transactions, accounts, buckets, vaults, backup)
│   │   ├── core/             # Configuration & Exception handlers
│   │   ├── db/               # VaultManager & Session manager
│   │   ├── models/           # SQLModel Entities (Transaction, Account, Category, Bucket, Debt)
│   │   ├── repositories/     # Database CRUD Repositories
│   │   └── services/         # Business logic layer
│   ├── migrations/           # Alembic schema migration scripts
│   ├── alembic.ini           # Alembic configuration
│   └── requirements.txt      # Python dependencies
│
├── frontend/                 # Vue 3 + Vite Application
│   ├── src/
│   │   ├── components/       # UI Components (Dashboard, TransactionList, SettingsView, VaultModal)
│   │   ├── services/         # API Service Client
│   │   └── utils/            # Date and currency formatting helpers
│   └── package.json
│
├── data/                     # Local SQLite Databases (Vaults) [Git-Ignored]
│   └── finance.db
│
├── backups/                  # Snapshot Backups [Git-Ignored]
│
├── tests/                    # Backend Pytest Test Suite
│   ├── conftest.py
│   ├── test_transaction_api.py
│   └── test_vaults_and_backup.py
│
├── .env.example              # Environment defaults template
├── .gitignore                # Comprehensive git ignore rules
├── package.json              # Root 1-command startup configuration
└── README.md                 # Project Documentation
```

---

## 🧪 Running Unit Tests

Run the full pytest suite (covering API endpoints, transaction logic, savings buckets, dynamic vaults, and backup handlers):

```bash
# Windows
backend\.venv\Scripts\pytest.exe

# macOS / Linux
pytest
```

Run frontend build verification:

```bash
npm run build
```

---

## ❓ Troubleshooting

- **Port Conflicts (`8000` or `5173` in use)**:
  - You can customize `BACKEND_PORT` or `FRONTEND_PORT` in your `.env` file.
- **SQLite Database File Lock on Windows**:
  - If a file lock warning appears when deleting a vault, switch to another vault first or restart `npm run dev`.
- **Missing Dependencies**:
  - Re-run `npm run install:all` and `pip install -r backend/requirements.txt`.

---

## 📄 License

MIT License. Open source and free for personal use.
