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
  <!-- License & Status -->
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen" alt="Node Version"></a>
  <a href="https://www.npmjs.com"><img src="https://img.shields.io/badge/npm-%3E%3D9-blue" alt="npm Version"></a>
  <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome"></a>
  <a href="https://github.com/anupam6335/DevRhythm/stargazers"><img src="https://img.shields.io/github/stars/anupam6335/DevRhythm?style=social" alt="GitHub Stars"></a>
  <br>
  <!-- Backend technologies -->
  <img src="https://img.shields.io/badge/Express.js-000000?logo=express&logoColor=white" alt="Express.js">
  <img src="https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white" alt="MongoDB">
  <img src="https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white" alt="Redis">
  <img src="https://img.shields.io/badge/Mongoose-880000?logo=mongoose&logoColor=white" alt="Mongoose">
  <img src="https://img.shields.io/badge/Passport-34E27A?logo=passport&logoColor=white" alt="Passport">
  <img src="https://img.shields.io/badge/JWT-000000?logo=json-web-tokens&logoColor=white" alt="JWT">
  <img src="https://img.shields.io/badge/Winston-231F20?logo=winston&logoColor=white" alt="Winston">
  <img src="https://img.shields.io/badge/Jest-C21325?logo=jest&logoColor=white" alt="Jest">
  <br>
  <!-- Frontend technologies -->
  <img src="https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/React_Query-FF4154?logo=react-query&logoColor=white" alt="React Query">
  <img src="https://img.shields.io/badge/Axios-5A29E4?logo=axios&logoColor=white" alt="Axios">
  <img src="https://img.shields.io/badge/Zod-3E67B1?logo=zod&logoColor=white" alt="Zod">
  <img src="https://img.shields.io/badge/date--fns-7700AA?logo=date-fns&logoColor=white" alt="date-fns">
  <img src="https://img.shields.io/badge/CSS_Modules-000000?logo=css-modules&logoColor=white" alt="CSS Modules">
  <br>
  <!-- Code quality -->
  <img src="https://img.shields.io/badge/ESLint-4B32C3?logo=eslint&logoColor=white" alt="ESLint">
  <img src="https://img.shields.io/badge/Prettier-F7B93E?logo=prettier&logoColor=white" alt="Prettier">
  <!-- Docker & Deployment (optional, not from package.json but nice to have) -->
  <img src="https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white" alt="Docker">
  <img src="https://img.shields.io/badge/Railway-0B0D0E?logo=railway&logoColor=white" alt="Railway">
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

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting a pull request.

- Report bugs via [GitHub Issues](https://github.com/anupam6335/DevRhythm/issues)
- Suggest features via [Discussions](https://github.com/anupam6335/DevRhythm/discussions)

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
