# Ligue Sportive d'Auvergne - Equipment Rental

1-day project | 3 developers

## Quick Start

```bash
# Install everything
npm run install:all

# Configure environment
# 1. Copy .env.example to .env in both backend/ and frontend/
# 2. Edit backend/.env with your PostgreSQL DB connection string

# Start development
npm run dev
```

Visit: http://localhost:3000

## Structure

```
├── backend/    # Express + PostgreSQL (MVC)
|   ├── config/      # Connection to the DB
│   ├── db/          # DB init : pool, schema creation, transactions 
|   ├── repositories/  # DB Data access : queries 
│   ├── controllers/ # Business logic
│   ├── routes/      # API endpoints
│   └── middleware/  # Auth, validation
│
├── frontend/   # React (MVC)
│   ├── models/      # API calls, data services
│   ├── controllers/ # Auth, business logic
│   └── views/       # React components
│       ├── pages/
│       └── components/
│
└── shared/     # TypeScript types (Order, Product, etc.)
```

## Stack

- **Backend**: Express + PostgreSQL + JWT
- **Frontend**: React + native fetch (no Axios/Zustand/Zod)
- **Shared**: TypeScript types only
- **No tests**: 1-day scope

## Environment Setup

Both backend and frontend have `.env.example` files.  
Copy them to `.env` and configure:

**Backend (.env):**
- DATABASE_URL - Your PostgreSQL DB connection string
- JWT_SECRET - Secret key for JWT tokens

**Frontend (.env):**
- VITE_API_URL - Backend API URL (default: http://localhost:5000/api)

## Scripts

```bash
npm run dev              # Start backend + frontend
npm run dev:backend      # Backend only
npm run dev:frontend     # Frontend only
npm run build            # Build all
npm run install:all      # Install + build shared
```

## Git Structure

All folders preserved with `.gitkeep` files.  
Empty folders will remain in version control.

```bash
git log        # See initial architecture commit
git status     # Check working directory
```

## Next Steps (& How to run the project)

1. Team members pull the repo
2. Run `npm run install:all`
3. Configure `.env` files
4. Each dev implements their assigned features
5. Test integration as features complete

---

Ready for implementation.