# MSME Signal Score 📊

> **AI-powered invisible credit scoring for Micro, Small & Medium Enterprises (MSMEs)** — using alternative financial signals like GST compliance, UPI frequency, utility bill punctuality, and ITR filing instead of traditional credit bureau data.

---

## 🚀 Live Demo

| Service | URL |
|---------|-----|
| Frontend (React) | `http://localhost:5173` |
| Backend API (FastAPI) | `http://localhost:8000` |
| API Docs (Swagger UI) | `http://localhost:8000/docs` |

---

## 🏗️ Architecture Overview

```
msme-signal-score/
├── backend/                  # Python FastAPI REST API + ML Pipeline
│   ├── main.py               # All API routes (CRUD, Auth, ML inference)
│   ├── models.py             # SQLAlchemy ORM models (User, MSMERecord)
│   ├── schemas.py            # Pydantic request/response schemas
│   ├── auth.py               # JWT auth, bcrypt password hashing, RBAC
│   ├── database.py           # SQLite connection & session factory
│   ├── seed.py               # Generates 500 realistic MSME records + training_data.csv
│   ├── train_model.py        # Trains RandomForest model → msme_score_model.pkl
│   └── requirements.txt      # Python dependencies
│
└── src/                      # React + TypeScript frontend (Vite)
    ├── pages/
    │   ├── Index.tsx          # Login page + MSME lookup/search
    │   ├── Dashboard.tsx      # Per-MSME credit score dashboard with charts
    │   ├── MSMEForm.tsx       # Create/edit MSME records (admin only)
    │   └── NotFound.tsx       # 404 page
    ├── components/
    │   ├── NavLink.tsx        # Navigation component
    │   └── ui/               # shadcn/ui component library
    ├── hooks/
    │   ├── use-auth.ts        # Auth state management (Zustand)
    │   └── use-msme-store.ts  # MSME data fetching (React Query)
    └── lib/
        ├── api.ts             # Axios API client with auth interceptors
        └── types.ts           # TypeScript type definitions
```

### Data Flow

```
Browser → React (Vite) → FastAPI → SQLite (Feature Store)
                                 ↓
                         Scikit-Learn RandomForest
                                 ↓
                         Predicted Score (0–100) + AI Confidence
```

---

## 🧠 ML Pipeline — How the Score is Generated

The credit score is **not rule-based** — it is predicted by a trained **RandomForest Regressor** using 11 alternative financial signals:

### Feature Engineering

| Feature | Type | Description |
|---|---|---|
| `established_year` | Numeric | Business age proxy |
| `avg_monthly_balance` | Numeric | Cash flow proxy (₹) |
| `bounce_rate_percent` | Numeric | % of cheque/NACH bounces |
| `bureau_vintage_months` | Numeric | Months of credit footprint |
| `gst_compliance` | Categorical | `on_time` / `occasionally_late` / `frequently_late` |
| `utility_punctuality` | Categorical | `on_time` / `sometimes_late` / `often_late` |
| `upi_frequency` | Categorical | `high` / `medium` / `low` |
| `digital_presence` | Categorical | `strong` / `basic` / `none` |
| `location_stability` | Categorical | `stable` / `changed_once` / `unstable` |
| `itr_filed_last_year` | Boolean | Tax compliance indicator |
| `monthly_revenue_trend` | Categorical | `growing` / `stable` / `declining` |

### Model Training Pipeline

1. **Data Generation** — `seed.py` generates 500 realistic synthetic records seeded with a hidden "business quality" variable (poor / average / excellent) to create realistic feature correlations and a `target_score` (0–100).
2. **Preprocessing** — `ColumnTransformer` applies `StandardScaler` on numerics and `OneHotEncoder` on categoricals.
3. **Model** — `RandomForestRegressor` with 100 estimators (`n_estimators=100, random_state=42`).
4. **Output** — Saved as `msme_score_model.pkl` + `model_features.pkl` (for feature importance).
5. **AI Confidence** — Calculated as the inverse of variance across all tree predictions (high inter-tree disagreement = low confidence).

---

## ⚙️ Setup & Running Locally

### Prerequisites

- **Node.js** ≥ 18 and **npm** ≥ 9
- **Python** ≥ 3.11
- **Git**

---

### 1. Clone the Repository

```sh
git clone https://github.com/Siddardha-CH/msme-signal-score.git
cd msme-signal-score
```

---

### 2. Backend Setup (FastAPI + ML)

```sh
cd backend

# Create and activate a virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Install all dependencies
pip install -r requirements.txt

# Step 1: Seed the database (creates msme.db + training_data.csv)
python seed.py

# Step 2: Train the ML model (creates msme_score_model.pkl + model_features.pkl)
python train_model.py

# Step 3: Start the API server
uvicorn main:app --reload --port 8000
```

The API will be live at `http://localhost:8000`.
Interactive Swagger docs: `http://localhost:8000/docs`

---

### 3. Frontend Setup (React + Vite)

Open a **new terminal** from the project root:

```sh
# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be live at `http://localhost:5173`.

---

## 🔐 Authentication & User Roles

The system uses **JWT Bearer tokens** (HS256) valid for **8 hours**.

Three demo accounts are seeded automatically on first run:

| Username | Password | Role | Permissions |
|----------|----------|------|-------------|
| `admin` | `password123` | Admin | Full CRUD, user management, ML scoring |
| `analyst1` | `password123` | Analyst | Read all records, view scores |
| `viewer1` | `password123` | Viewer | Read-only access |

### Role Capabilities

| Feature | Admin | Analyst | Viewer |
|---------|-------|---------|--------|
| View MSME records | ✅ | ✅ | ✅ |
| View credit scores | ✅ | ✅ | ✅ |
| Create MSME records | ✅ | ❌ | ❌ |
| Edit MSME records | ✅ | ❌ | ❌ |
| Manage users | ✅ | ❌ | ❌ |

---

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/login` | None | Get JWT token |
| `GET` | `/api/me` | Bearer | Get current user info |
| `GET` | `/api/users` | Admin | List all users |
| `POST` | `/api/users` | Admin | Create a new user |
| `DELETE` | `/api/users/{username}` | Admin | Delete a user |
| `GET` | `/api/msme/{gstin}` | None | Get MSME record by GSTIN |
| `POST` | `/api/msme` | Admin | Create MSME record |
| `PUT` | `/api/msme/{gstin}` | Admin | Update MSME record |
| `GET` | `/api/score/{gstin}` | None | Run ML inference & get credit score |

### Example: Get a Credit Score

```sh
curl http://localhost:8000/api/score/29ABCDE1234F1Z5
```

**Response:**
```json
{
  "status": "success",
  "gstin": "29ABCDE1234F1Z5",
  "predicted_score": 74,
  "ml_metadata": {
    "model_type": "RandomForestRegressor",
    "prediction_confidence": 88,
    "version": "1.0.0"
  }
}
```

---

## 🖥️ Frontend Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `Index.tsx` | Login page; post-login MSME search by GSTIN |
| `/dashboard/:gstin` | `Dashboard.tsx` | Credit score, signal breakdown charts, ML confidence |
| `/msme/new` | `MSMEForm.tsx` | Admin form to register a new MSME |
| `/msme/edit/:gstin` | `MSMEForm.tsx` | Admin form to update an existing MSME |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| TypeScript | 5 | Type safety |
| Vite | 5 | Build tool & dev server |
| React Router | 6 | Client-side routing |
| TanStack Query | 5 | Server state management & caching |
| Zustand | 5 | Client auth state |
| Recharts | 2 | Score visualization charts |
| shadcn/ui | Latest | Accessible UI components (Radix UI) |
| Tailwind CSS | 3 | Utility-first styling |
| Framer Motion | 12 | Animations |
| React Hook Form + Zod | 7 / 3 | Form validation |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| FastAPI | 0.115 | REST API framework |
| Uvicorn | 0.30 | ASGI server |
| SQLAlchemy | 2.0 | ORM & database abstraction |
| SQLite | Built-in | Feature store database |
| Pydantic | 2.9 | Data validation & serialization |
| Scikit-Learn | 1.5 | ML pipeline (RandomForest) |
| Pandas | 2.2 | Data manipulation for ML |
| Joblib | 1.4 | Model serialization (.pkl) |
| python-jose | 3.3 | JWT token creation & validation |
| bcrypt | 4.2 | Password hashing |

---

## 📁 Generated Files (Not in Git)

These files are generated locally and are listed in `.gitignore`:

| File | Generated By | Description |
|------|-------------|-------------|
| `backend/msme.db` | `seed.py` | SQLite database with 500 MSME records |
| `backend/training_data.csv` | `seed.py` | CSV training dataset for the ML model |
| `backend/msme_score_model.pkl` | `train_model.py` | Trained RandomForest pipeline |
| `backend/model_features.pkl` | `train_model.py` | Feature names for importance explanation |

> After cloning, always run `seed.py` then `train_model.py` before starting the server.

---

## 🧪 Running Tests

```sh
# Frontend unit tests (Vitest + React Testing Library)
npm test

# Watch mode
npm run test:watch
```

---

## 📦 Scripts Reference

### Frontend (`package.json`)

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Start dev server with HMR |
| `build` | `vite build` | Production build |
| `preview` | `vite preview` | Preview production build |
| `lint` | `eslint .` | Run ESLint |
| `test` | `vitest run` | Run tests once |
| `test:watch` | `vitest` | Run tests in watch mode |

### Backend

| Script | Description |
|--------|-------------|
| `python seed.py` | Generate 500 MSME records + training CSV |
| `python train_model.py` | Train and save the RandomForest model |
| `uvicorn main:app --reload` | Start the FastAPI dev server |

---

## 🔒 Security Notes

- **JWT Secret Key**: Currently hardcoded in `auth.py` for development. In production, read from an environment variable:
  ```python
  SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "fallback-dev-key")
  ```
- **CORS**: Currently set to `allow_origins=["*"]`. In production, restrict to your frontend domain.
- **Passwords**: Hashed with bcrypt (salt rounds auto-managed).

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
