# MSME Signal Score

> Invisible credit scoring for Micro, Small & Medium Enterprises using alternative financial signals — GST compliance, UPI activity, utility bill punctuality, ITR filing — instead of traditional bureau data.

![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.5-6DB33F?logo=springboot)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)

## What It Does

Many MSMEs lack formal credit history yet have strong business fundamentals. This platform scores them (0–100) using 10 alternative signals, assigns a credit grade (A–F), and exposes per-factor breakdowns for lenders.

### Scoring Factors

| Factor | Weight | Signal Source |
|---|---|---|
| Business Age | 10% | Registration year |
| GST Compliance | 20% | Filing rate (0–100) |
| Utility Payment | 15% | Punctuality score |
| UPI Activity | 10% | Transaction frequency |
| Digital Presence | 10% | Online footprint score |
| Bank Balance | 10% | Avg monthly balance |
| Check Bounce Rate | 10% | Bounce incidents |
| ITR Filing | 10% | Yes / No |
| Credit Vintage | 5% | Bureau history length |
| Revenue Trend | 10% | Monthly growth |

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Spring Boot 3.3, Spring Security, JPA/Hibernate |
| Auth | JWT with role-based access (admin / analyst / viewer) |
| Database | PostgreSQL 16 |
| Frontend | React 18, TypeScript, Tailwind CSS, Vite |
| Scoring | Pure Java deterministic engine (weighted sum) |

## Project Structure

```
msme-signal-score/
├── backend-spring/         # Spring Boot backend (Java 21)
│   ├── src/main/java/com/msme/
│   │   ├── controller/     # AuthController, MsmeController
│   │   ├── service/        # JwtService, ScoringService
│   │   ├── model/          # AppUser, MsmeRecord
│   │   ├── repository/     # UserRepository, MsmeRepository
│   │   └── config/         # SecurityConfig, JwtAuthFilter
│   └── src/main/resources/
│       └── application.properties
└── src/                    # React frontend
    └── pages/              # Dashboard, MSMEForm, Index
```

## API Endpoints

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/msme` | Any | List all MSME records |
| GET | `/api/msme/{gstin}` | Any | Get record by GSTIN |
| GET | `/api/msme/score/{gstin}` | Any | Get credit score |
| POST | `/api/msme` | Admin | Create new record |
| PUT | `/api/msme/{gstin}` | Admin | Update record |
| DELETE | `/api/msme/{gstin}` | Admin | Delete record |

## Running Locally

### Prerequisites
- Java 21+, Maven 3.9+
- PostgreSQL 16 on `localhost:5432`
- Node.js 18+

### 1. Database Setup
```sql
CREATE DATABASE msme_db;
```

### 2. Backend
```bash
cd backend-spring
mvn spring-boot:run
# Starts on http://localhost:8080
# Seeds 3 demo users + 3 sample MSME records on first run
```

### 3. Frontend
```bash
npm install
npm run dev
# Starts on http://localhost:5173
```

## Demo Credentials

| Username | Password | Role |
|---|---|---|
| admin | admin123 | Admin (full access) |
| analyst | analyst123 | Analyst (read + score) |
| viewer | viewer123 | Viewer (read only) |
