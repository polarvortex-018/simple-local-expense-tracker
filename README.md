# 💸 Cash Buddy — Local-First Personal Finance & Debt Tracker

A modern, ultra-sleek, **local-first personal finance tracking application** for Web and Android built with FastAPI, Vue 3, Vite, Capacitor 7, SQLModel, and SQLite.

Designed for complete data ownership, 60fps fluid motion, and zero cloud lock-in: your financial data remains 100% local, private, and portable.

---

## 🌟 Key Features

- **🚀 1-Command Web Launch**: Start both the FastAPI backend and Vue 3 frontend simultaneously with `npm run dev`.
- **📱 Android & Mobile Native Integration**: Built with **Capacitor 7**, featuring native filesystem support (`@capacitor/filesystem`), file sharing (`@capacitor/share`), and native status bar styling.
- **🏛️ Obsidian-Style Financial Vaults**: Manage multiple isolated database files (`Personal.db`, `Freelance.db`, `Family.db`) and switch between them dynamically in 1 click.
- **🌊 Staggered Cascade Motion & Animations**: Fluid 60fps entrance animations across all views, tactile spring micro-presses on CTAs, sliding bottom navigation pill indicators, animated number tickers, and spring float toast notifications.
- **📈 Interactive Donut Charts & Physics**: Donut charts on Dashboard and History with ambient continuous rotation, snap-to-top slice alignment physics, active category color auras, and floating sparkle particles.
- **🪣 Dual-Dimension Savings Allocations**: Track **where** your money is stored (Bank Accounts, Cash, Wallet) independently of **why** your money exists (Emergency Fund, Travel, Rent, Investments) presented in a clean hairline grid.
- **🤝 Debt & IOU Tracker**: Keep track of money lent to others and money borrowed, with full settlement history and net position calculation.
- **⚡ Automatic Database Creation & Migrations**: Zero manual SQL setup. The application automatically creates `data/finance.db`, runs Alembic migrations (`alembic upgrade head`), and seeds default categories on launch.
- **💾 Export, Import & Local Snapshots**: 1-click database exports, timestamped local snapshots (`backups/`), and seamless database restoration.
- **🔒 Privacy First & Portable**: 100% local-first SQLite architecture. No third-party data tracking or cloud lock-in.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: Vue 3 (Composition API `<script setup>`), Vite, Tailwind CSS, Material Symbols.
- **Mobile Runtime**: Capacitor 7 (@capacitor/android, @capacitor/filesystem, @capacitor/share, @capacitor/status-bar).
- **Backend**: FastAPI (Python 3.10+), SQLModel (SQLAlchemy 2.0), Pydantic v2, Alembic.
- **Database**: Local SQLite database files (`data/finance.db`) with fallback WebAssembly SQLite support (`sql-wasm.wasm`).

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd financial-tracking-app-v2
```

### 2. Install Dependencies

Install root and frontend dependencies:

```bash
npm run install:all
```

*(Optionally install Python backend dependencies into a virtual environment)*:

```bash
python -m venv backend/.venv

# Windows PowerShell:
.\backend\.venv\Scripts\Activate.ps1

# macOS / Linux:
source backend/.venv/bin/activate

pip install -r backend/requirements.txt
```

### 3. Run the Web Development Server

Start both backend (FastAPI @ `http://localhost:8000`) and frontend (Vite @ `http://localhost:5173`) with **one command**:

```bash
npm run dev
```

Open **`http://localhost:5173`** in your browser. The database and schema will initialize automatically!

---

## 📱 Building & Syncing for Android Mobile

To build the web frontend and sync assets to the Android Capacitor project:

```bash
cd frontend

# 1. Build production Web assets
npm run build

# 2. Sync assets with native Android platform
npx cap sync android

# 3. Open project in Android Studio (to run on device/emulator)
npx cap open android
```

---

## 🏛️ Financial Vaults (Multi-Database System)

Just like **Obsidian Vaults**, Cash Buddy supports managing multiple completely independent database files:

- **Switching Vaults**: Click **Settings → Database & Vaults** (or the Vault indicator) to open the Vault Manager and switch vaults instantly.
- **Creating a Vault**: Enter a name (e.g. *Freelance*, *Family*) and click **+ Create Vault**. A new SQLite file will be created in `data/`, migrated to the latest schema, and initialized with default categories.
- **Importing a Vault**: Select an existing `.db` file from your machine to import it as a new vault without overwriting your current data.

---

## 💾 Backup, Export & Restore

### Export Active Database
- Navigate to **More / Settings** -> **Database Backup & Snapshots**.
- Click **⬇️ Export Active Database** to download your current SQLite database file.

### Snapshot Backups
- Click **📸 Create Local Snapshot** in Settings to save a timestamped copy (e.g. `backup_finance_20260822_180000.db`) into the `backups/` directory.
- Click **Restore** next to any snapshot to revert to that exact state.

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
├── frontend/                 # Vue 3 + Vite + Capacitor Application
│   ├── android/              # Native Android Capacitor Platform
│   ├── src/
│   │   ├── components/       # UI Components (Dashboard, TransactionList, DebtList, SettingsView, VaultModal)
│   │   ├── services/         # API & Database Service Client
│   │   ├── utils/            # Date, icon, and currency formatting helpers
│   │   └── style.css         # Global Tailwind & Motion System CSS
│   ├── capacitor.config.json # Capacitor 7 App Configuration
│   └── package.json
│
├── data/                     # Local SQLite Database Files (Vaults) [Git-Ignored]
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

## 🧪 Verification & Testing

Run the backend Pytest suite:

```bash
# Windows
backend\.venv\Scripts\pytest.exe

# macOS / Linux
pytest
```

Run frontend build verification:

```bash
cd frontend
npm run build
```

---

## 📄 License

MIT License. Open source and free for personal use.
