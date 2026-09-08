# 🛠️ Findr — Express & Supabase REST API Backend

A dedicated Node.js/Express REST API backend server connecting to PostgreSQL via Supabase.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Development Mode
```bash
npm run dev
```
The server will start on **`http://localhost:5000`**.

### 3. Build & Run in Production
```bash
npm run build
npm start
```

---

## 📡 API Endpoints

### Health & Diagnostics
- `GET /api/health` — Verifies PostgreSQL connectivity and reports latency.

### Items
- `GET /api/items` — List and filter active items (`?type=LOST|FOUND&category=...&search=...`)
- `GET /api/items/:id` — Get single item with reporter details and claim count
- `POST /api/items` — Create new item report (Requires `Authorization: Bearer <token>`)
- `PATCH /api/items/:id` — Update item report (Reporter only)
- `DELETE /api/items/:id` — Delete item report (Reporter only)

### Claims
- `GET /api/claims` — Get claims made by user + claims received on user's items
- `POST /api/claims` — Submit a claim with security answer (`{ item_id, message }`)
- `PATCH /api/claims/:id` — Accept/Reject claim (`{ status: "ACCEPTED" | "REJECTED" }`)

### Authentication
- `POST /api/auth/login` — Sign in with email & password
- `POST /api/auth/signup` — Register new user
- `GET /api/auth/me` — Get current profile using JWT token
