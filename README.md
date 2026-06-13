# MSME Signal Score — Alternative Credit Assessment Platform

> Score small businesses 0–100 using 10 alternative financial signals — GST compliance, UPI frequency, ITR filing — making credit-invisible MSMEs bankable without formal bureau data.

![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.5-6DB33F?style=flat&logo=spring)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-336791?style=flat&logo=postgresql)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript)

---

## The Problem

60M+ MSMEs in India are credit-invisible. Banks reject them for lacking formal credit history, despite strong fundamentals — regular GST payments, high UPI volumes, consistent ITR filings. Traditional bureaus can't see this data.

## The Solution

A deterministic scoring engine that reads 10 alternative signals and produces a 0–100 score with A–F grade. Lenders get a risk signal; businesses get a path to credit.

---

## Features

| Feature | Detail |
|---|---|
| **10-Factor Scoring Engine** | GST compliance, utility payments, UPI frequency, digital presence, bank balance, check bounce, ITR filing, credit vintage, revenue trend, business age |
| **Credit Grades A–F** | Score with per-factor breakdown for explainability |
| **Role-Based Access** | Admin (CRUD) · Analyst (read + score) · Viewer (read-only) |
| **GSTIN Lookup** | Fetch any business by GSTIN, compute score on demand |
| **JWT Auth** | Spring Security with BCrypt + stateless sessions |
| **Pre-seeded Demo Data** | 3 users + 3 MSME records on first boot |

---

## Tech Stack

**Backend** — Spring Boot 3.3.5 · Spring Security · JPA/Hibernate · PostgreSQL · jjwt 0.12.6
**Frontend** — React 18 · TypeScript · Tailwind CSS · Vite · Zustand · Framer Motion

---

## Scoring Model

| Signal | Weight | Measurement |
|---|---|---|
| Business Age | 10% | Years since establishment (capped at 20yr = 100) |
| GST Compliance | 20% | Compliance score 0–100 |
| Utility Payment | 15% | Punctuality score 0–100 |
| UPI Frequency | 10% | Monthly transactions (10/month = 100) |
| Digital Presence | 10% | Digital activity score 0–100 |
| Bank Balance | 10% | Avg monthly balance (₹2L = 100) |
| Check Bounce Rate | 10% | 0 bounces = 100, penalises heavily |
| ITR Filing | 10% | Binary: filed = 100, not filed = 0 |
| Credit Vintage | 5% | Years of credit history (10yr = 100) |
| Revenue Trend | 10% | Monthly trend score 0–10 |

**Grade thresholds:** A ≥ 80 · B ≥ 65 · C ≥ 50 · D ≥ 35 · F < 35

---

## Getting Started

### 1. Database Setup

```sql
CREATE DATABASE msme_db;
```

### 2. Backend

```bash
cd backend-spring
mvn spring-boot:run
# API at http://localhost:8080
```

Seeds on first boot: `admin/admin123`, `analyst/analyst123`, `viewer/viewer123` + 3 MSME records.

### 3. Frontend

```bash
npm install
npm run dev
# Opens at http://localhost:5174
```

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | — | Returns JWT |
| GET | `/api/msme` | Any role | List all records |
| GET | `/api/msme/{gstin}` | Any role | Fetch by GSTIN |
| GET | `/api/msme/score/{gstin}` | Any role | Compute score |
| POST | `/api/msme` | ADMIN | Create record |
| PUT | `/api/msme/{gstin}` | ADMIN | Update record |
| DELETE | `/api/msme/{gstin}` | ADMIN | Delete record |

### Score Response

```json
{
  "status": "success",
  "gstin": "27AABCU9603R1ZX",
  "business_name": "TechSol Pvt Ltd",
  "predicted_score": 72,
  "grade": "B",
  "ml_metadata": {
    "model_type": "WeightedSignalRegressor",
    "prediction_confidence": 87.3,
    "version": "2.0"
  },
  "factors": {
    "gst_compliance": 80,
    "upi_activity": 70,
    "itr_filing": 100
  }
}
```

---

## Demo Credentials

| Username | Password | Role |
|---|---|---|
| `admin` | `admin123` | Full CRUD |
| `analyst` | `analyst123` | Read + Score |
| `viewer` | `viewer123` | Read only |

---

## License

MIT
