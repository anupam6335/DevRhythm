<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/3fa4d2aa-4e89-4e0d-a7e6-0a2f4da8dbfb">
    <source media="(prefers-color-scheme: light)" srcset="https://github.com/user-attachments/assets/3fa4d2aa-4e89-4e0d-a7e6-0a2f4da8dbfb">
    <img alt="DevRhythm Logo" src="https://github.com/user-attachments/assets/3fa4d2aa-4e89-4e0d-a7e6-0a2f4da8dbfb" width="120" height="120">
  </picture>
</p>

<h1 align="center">DevRhythm</h1>

<p align="center">
  <strong>Track, master, and share your coding journey.</strong><br>
  A full‑stack productivity platform for programmers who want to log problems, schedule spaced‑repetition revisions, set goals, and connect with the community.
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen" alt="Node Version"></a>
  <a href="https://www.npmjs.com"><img src="https://img.shields.io/badge/npm-%3E%3D9-blue" alt="npm Version"></a>
  <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome"></a>
  <a href="https://github.com/anupam6335/DevRhythm/stargazers"><img src="https://img.shields.io/github/stars/anupam6335/DevRhythm?style=social" alt="GitHub Stars"></a>
</p>

> 🚧 **Project Status**: Under active development – expect breaking changes and rapid iteration.

---

## ✨ Features

- **📚 Problem Tracking** – Log problems from LeetCode, HackerRank, Codeforces and more. Tag by platform, difficulty, pattern.
- **🔄 Spaced Repetition** – Automatically schedule revisions (1‑3‑7‑14‑30 days) for each solved problem.
- **🎯 Goals & Streaks** – Set daily/weekly targets, track completion, maintain streaks.
- **📊 Heatmap** – Visualise your activity over the year, filter by platform/difficulty, export data.
- **👥 Social** – Follow other developers, see their public progress, join study groups and challenges.
- **📤 Share** – Create shareable snapshots of your profile or a specific time period.
- **🧠 Pattern Mastery** – Analyse your confidence across problem patterns, get recommendations.
- **🌗 Zen‑inspired Themes** – Warm “Zen Paper” light mode and soft “Zen Charcoal” dark mode for long coding sessions.
- **⚡ Performance First** – Redis caching, rate limiting, MongoDB indexes, and efficient aggregation pipelines.

---

## 🛠 Tech Stack

| Backend | Frontend |
|--------|----------|
| Node.js 18+ | Next.js 15 (App Router) |
| Express | TypeScript |
| MongoDB (Mongoose) | React 19 |
| Redis (caching, rate‑limiting) | React Query |
| Passport (OAuth2 – Google/GitHub) | React Hook Form + Zod |
| JWT | CSS Modules + CSS Variables |
| Winston (logging) | date‑fns, React Markdown |
| Jest (testing) | Recharts (for heatmap) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9 or yarn
- MongoDB (local or Atlas)
- Redis (local or Upstash/Railway)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/anupam6335/DevRhythm.git
   cd DevRhythm
   ```

2. **Backend setup**
   ```bash
   cd backend
   cp .env.example .env
   # Fill in your environment variables (see below)
   npm install
   npm run dev
   ```

3. **Frontend setup**
   ```bash
   cd ../frontend
   cp .env.local.example .env.local
   # Fill in frontend variables
   npm install
   npm run dev
   ```

The backend runs on `http://localhost:5000`, frontend on `http://localhost:4000`.
---

## 🐳 Docker Deployment

Both services are containerised. A `Dockerfile` is provided in the backend root, and the frontend can be built as a standalone Next.js app.

```bash
# Build and run backend with Docker
cd backend
docker build -t devrhythm-backend .
docker run -p 5000:5000 --env-file .env devrhythm-backend
```

For production, consider using **Railway** (see `railway.toml` in backend) or a similar platform.

---

## 📁 Project Structure

### Backend (`/backend`)
```
devrhythm-backend/
├── src/
│   ├── app.js                 # Express app setup
│   ├── server.js               # Entry point
│   ├── config/                 # DB, Redis, Cloudinary, OAuth
│   ├── middleware/             # auth, cache, rateLimiter, errorHandler
│   ├── models/                 # Mongoose schemas (User, Question, Progress...)
│   ├── controllers/            # Business logic
│   ├── routes/                 # API routes (v1)
│   ├── services/               # Reusable services (heatmap, leaderboard, export)
│   ├── utils/                  # helpers, validators, constants, errors
│   ├── jobs/                   # Cron jobs (snapshots, notifications)
│   └── scripts/                # seed, backup, cleanup
├── tests/                       # Unit & integration tests
├── Dockerfile
├── railway.toml
└── .env.example
```

### Frontend (`/frontend`)
```
frontend/
├── src/
│   ├── app/                    # Next.js App Router (routes grouped by feature)
│   │   ├── (auth)/              # login, callback
│   │   ├── (main)/              # dashboard, profile, questions, revisions...
│   │   └── layout.tsx
│   ├── features/                # Feature-based modules (auth, user, question...)
│   │   ├── auth/
│   │   ├── user/
│   │   ├── question/
│   │   └── ...
│   ├── shared/                  # Reusable UI, hooks, lib, types, styles
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── types/
│   │   ├── styles/
│   │   └── config/
│   ├── providers/                # Context providers (Auth, Theme, Query)
│   └── middleware.ts             # Next.js middleware (auth, redirects)
├── public/
├── .env.local
└── next.config.js
```

---

## 📚 API Documentation

API documentation is auto‑generated using **Swagger** (when you run the backend).  
Visit `http://localhost:5000/api-docs` in development.

All endpoints are prefixed with `/api/v1`. A health check is available at `/api/v1/health`.

---

## 🧪 Running Tests

```bash
# Backend tests (Jest)
cd backend
npm test
npm run test:coverage

# Frontend tests (coming soon)
cd frontend
npm test
```
---

## 📄 License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.

---

## 🙌 Acknowledgements

- Inspired by spaced repetition systems (Anki, SuperMemo)
- Heatmap design inspired by GitHub contributions graph
- Fonts: [Commissioner](https://fonts.google.com/specimen/Commissioner), [Outfit](https://fonts.google.com/specimen/Outfit), [Patrick Hand](https://fonts.google.com/specimen/Patrick+Hand), Cascadia Mono

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/anupam6335">Anupam</a> and the DevRhythm community.
</p>
```
