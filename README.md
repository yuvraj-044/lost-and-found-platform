# 🔍 Lost & Found Platform

A full-stack, community-driven Lost & Found web application designed to connect people who have lost belongings with those who have found them. Built with **Next.js 16 (App Router)**, **Express.js (TypeScript)**, **Supabase (PostgreSQL)**, and **Tailwind CSS**.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-emerald?logo=supabase)

---

## ✨ Features

- **🔍 Live Search & Filter Feed**: Fast keyword search, status filter tabs (**All / Lost / Found**), and category filters (Electronics, Keys, Wallets, Bags, Pets, Documents, etc.).
- **📝 Simple Item Reporting**: Submit reports with title, category, location, date, description, and optional photo upload with base64 Data URL fallback.
- **🔒 Ownership Verification Workflow**: Claimants submit non-public proof (wallpaper photos, serial numbers, unique scratches, contents) to prove authentic ownership.
- **📊 User Dashboard**: Manage reported items (Mark Active / Resolved, Delete reports) and track incoming or submitted claims.

---

## 🛠️ Tech Stack

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
├── docs/                 # Project documentation & technical specifications
│   ├── README.md         # Documentation index & quick guide
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

### 3. Configure Environment Variables
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

## 🔒 Verification & Safety Flow

1. **Finder Posts Report**: Posts general public information without revealing unique private secrets.
2. **Owner Claims Item**: Submits a claim request with specific non-public identifying details.
3. **Finder Reviews Claim**: Inspects proof in their Dashboard. If correct, clicks **Accept Claim**.
4. **Contact Exchange**: Upon acceptance, status changes to `RESOLVED` and contact emails are shared to arrange handover.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
