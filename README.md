# 🔍 Lost & Found Platform

A full-stack, community-driven Lost & Found web application designed to connect people who have lost belongings with those who have found them. Built with **Next.js 16 (App Router)**, **Express.js (TypeScript)**, **Supabase (PostgreSQL)**, and **Tailwind CSS**.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-emerald?logo=supabase)

---

## ✨ Core Features & Verification Logic

- **🔒 Secret Detail Verification System**:
  - **Private Ownership Proof**: When reporting a **Lost** item, owners specify 2–3 private details (e.g., *"Red thread inside wallet"*, *"₹10 note in hidden pocket"*, *"Scratch on back corner"*).
  - **Zero Public Leakage**: Private details are strictly stripped from all public GET endpoints and are never displayed on public feeds or to potential claimants.
  - **Automated Verification**: When someone claims or reports finding the item, they must answer verification questions. The server runs secure server-side matching against the hidden secrets.
  - **Strict Acceptance Guardrail**: Lost item claims cannot be accepted unless the verification status is `passed`.
- **🔍 Live Search & Filter Feed**: Fast keyword search, status filter tabs (**All / Lost / Found**), and category filters (Electronics, Keys, Wallets, Bags, Pets, Documents, etc.).
- **📝 Multi-Step Item Reporting**: Intuitive stepped reporting flow with public information, photo uploads, and private verification secrets.
- **📊 Comprehensive User Dashboard**: 3-tier management tab view:
  - *My Reported Items*: Manage active/resolved posts.
  - *Claims On My Items*: Inspect verification badges (`passed` / `failed`), claimant answers, and accept/reject controls.
  - *My Submitted Claims*: Track progress of claims submitted on other items.

- **Frontend**: Next.js 16 (App Router, Turbopack, React 19), Tailwind CSS, Lucide / Material Icons
- **Backend API**: Express.js, Node.js, TypeScript REST API
- **Database & Auth**: Supabase (PostgreSQL), Row Level Security (RLS) policies
- **Monorepo Management**: Root `package.json` with `concurrently`

---

## 📁 Repository Structure

```text
├── app/                  # Next.js 16 Frontend (App Router, Tailwind CSS, SSR)
│   ├── src/
│   │   ├── app/          # Pages & API routes (Home, Report, Dashboard, Auth)
│   │   ├── components/   # Modular UI components (Layout, Explore, Modals)
│   │   ├── lib/          # Server actions, Supabase client & utilities
│   │   └── types/        # TypeScript database & entity interfaces
│   └── public/           # Static assets
├── backend/              # Express.js TypeScript Backend API
│   └── src/
│       ├── config/       # Supabase service client & environment config
│       ├── middleware/   # Authentication & request validation middleware
│       ├── routes/       # Express route handlers (items, claims, auth)
│       └── server.ts     # Express application entrypoint
├── docs/                 # Technical documentation
│   ├── architecture.md   # Architecture design, state machine & diagrams
│   ├── backend.md        # REST API endpoints & backend specifications
│   ├── database.md       # PostgreSQL schema, ERD & RLS policies
│   ├── frontend.md       # Frontend UI/UX design & client structure
│   └── idea.md           # Product concept, features & roadmap
├── supabase/             # Shared Database Migrations & SQL Seed Scripts
│   ├── migrations/       # Version-controlled database schema migrations
│   ├── fix_auth_schema.sql
│   └── cleanup_demo_accounts.sql
├── package.json          # Root monorepo configuration (concurrent scripts)
└── README.md             # Project overview & local setup guide
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher

### 1. Clone the Repository
```bash
git clone https://github.com/yuvraj-044/lost-and-found-platform.git
cd lost-and-found-platform
```

### 2. Install Dependencies
```bash
# Install root monorepo dependencies
npm install

# Install frontend & backend dependencies
cd app && npm install && cd ..
cd backend && npm install && cd ..
```

### 3. Database Setup (Supabase)
Run the migration scripts located in `supabase/migrations/` in your Supabase SQL Editor:
1. `001_initial_schema.sql` — Initial tables, views, and RLS policies.
2. `002_verification_schema.sql` — Secret detail verification system columns (`private_details`, `verification_status`, `verification_answers`, `is_admin`).

### 4. Configure Environment Variables
Copy `.env.example` to `.env.local` in `app/` and `.env` in `backend/`:

**Frontend (`app/.env.local`)**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3000
```

**Backend (`backend/.env`)**:
```env
PORT=5050
NODE_ENV=development
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
FRONTEND_URL=http://localhost:3000
```

---

## ⚡ Running Locally

Run a single command in the root folder to start both frontend and backend concurrently:

```bash
npm run dev
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5050](http://localhost:5050)
- **Health Endpoint**: [http://localhost:5050/api/health](http://localhost:5050/api/health)

---

## 🔒 Secret Detail Verification Workflow

The system guarantees ownership authenticity while protecting sensitive owner data:

```
[User A: Reports Lost Item]
    │  - Public Details: Title, Category, Location, Date, Description, Photo
    │  - Secret Details: 2-3 Private Ownership Clues (stored securely in DB)
    ▼
[Public Feed / Explore]
    │  - Displays Public Details ONLY (Private details strictly stripped)
    ▼
[User B: Submits Claim / Found Report]
    │  - Must answer verification questions corresponding to the hidden secrets
    ▼
[Server-Side Verification Engine]
    │  - Validates answers against stored private details using fuzzy/substring matching
    │  - Sets claim status: "passed" or "failed"
    ▼
[User A: Review in Dashboard]
    │  - Inspects claimant answers and verification badge
    │  - Guardrail: Can ONLY accept claims if verification has "passed"
    ▼
[Claim Accepted -> Item RESOLVED]
       - Item status updates to "RESOLVED"
       - Secure contact details exchanged for item handover
```

---

## 📡 REST API Endpoints

### Health & Diagnostics
- `GET /api/health` — Verifies database connection and server latency.

### Items
- `GET /api/items` — List and filter active items (`?type=LOST|FOUND&category=...&search=...`). Public data only (`private_details` are securely stripped).
- `GET /api/items/:id` — Get single item with reporter details (excludes `private_details`).
- `POST /api/items` — Create new item report (Includes optional `private_details` for LOST items).
- `PATCH /api/items/:id` — Update item report (Reporter only).
- `DELETE /api/items/:id` — Delete item report (Reporter only).

### Claims & Ownership Verification
- `GET /api/claims` — Fetch claims made by user and claims received on user's items.
- `POST /api/claims` — Submit a claim request for an item.
- `POST /api/claims/:id/verify` — Submit claimant answers to verify against the item's hidden private details (returns `passed` or `failed`).
- `PATCH /api/claims/:id` — Accept/Reject claim (`{ status: "ACCEPTED" | "REJECTED" }`). Enforces that lost item claims must have `verification_status: "passed"` to be accepted.

### Authentication
- `POST /api/auth/login` — Authenticate with email & password.
- `POST /api/auth/signup` — Register a new account.
- `GET /api/auth/me` — Get current profile using JWT token.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
