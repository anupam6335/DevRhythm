
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/3fa4d2aa-4e89-4e0d-a7e6-0a2f4da8dbfb">
    <source media="(prefers-color-scheme: light)" srcset="https://github.com/user-attachments/assets/3fa4d2aa-4e89-4e0d-a7e6-0a2f4da8dbfb">
    <img alt="DevRhythm Logo" src="https://github.com/user-attachments/assets/3fa4d2aa-4e89-4e0d-a7e6-0a2f4da8dbfb" width="120" height="120">
  </picture>
</p>

<h1 align="center">DevRhythm</h1>

<p align="center">
  <strong>Master your coding patterns with intelligent spaced repetition.</strong><br>
  Track, revise, and level up your problem‑solving skills – all in one elegant platform.
</p>

<p align="center">
  <!-- Backend status -->
  <a href="https://github.com/anupam6335/DevRhythm/actions/workflows/backend.yml"><img src="https://img.shields.io/github/actions/workflow/status/anupam6335/DevRhythm/backend.yml?branch=main&label=Backend%20CI&logo=github&style=flat-square" alt="Backend CI"></a>
  <a href="https://codecov.io/gh/anupam6335/DevRhythm"><img src="https://img.shields.io/codecov/c/github/anupam6335/DevRhythm?flag=backend&logo=codecov&label=Backend%20Coverage&style=flat-square" alt="Backend Coverage"></a>
  <!-- Frontend status -->
  <a href="https://github.com/anupam6335/DevRhythm/actions/workflows/frontend.yml"><img src="https://img.shields.io/github/actions/workflow/status/anupam6335/DevRhythm/frontend.yml?branch=main&label=Frontend%20CI&logo=github&style=flat-square" alt="Frontend CI"></a>
  <a href="https://codecov.io/gh/anupam6335/DevRhythm"><img src="https://img.shields.io/codecov/c/github/anupam6335/DevRhythm?flag=frontend&logo=codecov&label=Frontend%20Coverage&style=flat-square" alt="Frontend Coverage"></a>
  <!-- Tech stack badges -->
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen?logo=node.js&style=flat-square" alt="Node"></a>
  <a href="https://expressjs.com"><img src="https://img.shields.io/badge/Express-4.18-lightgrey?logo=express&style=flat-square" alt="Express"></a>
  <a href="https://mongodb.com"><img src="https://img.shields.io/badge/MongoDB-7.0-green?logo=mongodb&style=flat-square" alt="MongoDB"></a>
  <a href="https://redis.io"><img src="https://img.shields.io/badge/Redis-7.2-red?logo=redis&style=flat-square" alt="Redis"></a>
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-15.1-black?logo=next.js&style=flat-square" alt="Next.js"></a>
  <a href="https://reactjs.org"><img src="https://img.shields.io/badge/React-19-blue?logo=react&style=flat-square" alt="React"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&style=flat-square" alt="TypeScript"></a>
  <!-- Deployment badges -->
  <a href="https://railway.app"><img src="https://img.shields.io/badge/deployed%20on-Railway-0B0D0E?logo=railway&style=flat-square" alt="Railway"></a>
  <a href="https://vercel.com"><img src="https://img.shields.io/badge/deployed%20on-Vercel-000000?logo=vercel&style=flat-square" alt="Vercel"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="MIT"></a>
</p>

---

📖 **Table of Contents**

- [Why DevRhythm?](#why-devrhythm)
- [✨ Features](#-features)
- [🧱 Tech Stack](#-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [🧪 Testing](#-testing)
- [🚢 Deployment](#-deployment)
- [📚 API Documentation](#-api-documentation)
- [🎨 Design & Theming](#-design--theming)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [🙌 Acknowledgements](#-acknowledgements)

---

## 🌟 Why DevRhythm?

Most developers solve problems but forget them within days.  
DevRhythm combines:

- **Spaced repetition** – never let a learned problem slip away.
- **Visual heatmaps** – see your consistency at a glance.
- **Pattern mastery** – track your proficiency in algorithmic patterns.
- **Social accountability** – follow friends, join study groups, share progress.

Whether you're preparing for coding interviews or just want to build a lasting habit, DevRhythm helps you stay in rhythm.

---

## ✨ Features

| Category       | Highlights                                                                                                                                                                                                 |
|----------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 📝 Questions   | Add, search, filter by platform, difficulty, tags, patterns. Soft‑delete and restore.                                                                                                                       |
| 📊 Progress    | Track status (Not Started → Attempted → Solved → Mastered). Record attempts, notes, code, confidence.                                                                                                      |
| 🔄 Revisions   | Automatic spaced repetition schedules (1‑3‑7‑14‑30 days). Today’s pending, upcoming, overdue views.                                                                                                        |
| 🎯 Goals       | Set daily/weekly targets. Auto‑create goals. Track streaks and completion rates.                                                                                                                            |
| 🔥 Heatmap     | Year‑round activity visualisation (like GitHub). Filter by platform, difficulty, or activity type. Export as JSON/CSV.                                                                                      |
| 📈 Pattern Mastery | Analyse your performance by algorithmic pattern. Get recommendations for weakest patterns.                                                                                                                  |
| 👥 Social      | Follow/unfollow users. See followers/following lists. Mutual follows and suggestions.                                                                                                                        |
| 📤 Shares      | Create public or link‑only share pages of your solved problems (profile or custom period).                                                                                                                  |
| 👥 Study Groups | Form groups, set collective goals, create challenges, see leaderboards.                                                                                                                                     |
| 🌗 Themes      | Zen Paper (light) and Zen Charcoal (dark) – carefully crafted for long coding sessions.                                                                                                                      |

---

## 🧱 Tech Stack

<details>
<summary><strong>Backend</strong> (Node.js + Express)</summary>

- **Runtime:** Node.js 18+
- **Framework:** Express 4.18
- **Database:** MongoDB (Mongoose 7.5) with indexes for performance
- **Caching:** Redis 7.2 (sessions, rate limiting, API cache)
- **Authentication:** Passport.js (Google OAuth 2.0, GitHub OAuth) + JWT
- **Validation:** Joi
- **File Uploads:** Cloudinary (Multer)
- **Background Jobs:** node‑cron
- **Logging:** Winston + Morgan
- **Testing:** Jest + Supertest
- **Deployment:** Railway (Docker ready)

</details>

<details>
<summary><strong>Frontend</strong> (Next.js + TypeScript)</summary>

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5.7
- **Styling:** CSS Modules + CSS variables (fully themeable)
- **State Management:** React Query (@tanstack/react-query)
- **Forms:** React Hook Form + Zod
- **HTTP Client:** Axios (with typed API client)
- **Date Handling:** date‑fns
- **UI Components:** 100% custom (no UI library) – Button, Avatar, Badge, Modal, etc.
- **Icons:** React Icons
- **Markdown:** react‑markdown + remark‑gfm
- **Code Highlighting:** react‑syntax‑highlighter
- **Toast Notifications:** react‑hot‑toast
- **Deployment:** Vercel

</details>

---

## 📁 Project Structure

The repository is split into two independent applications – backend and frontend – both inside a single monorepo.  
Each has its own detailed README with file‑by‑file explanations.

```

DevRhythm/
├── backend/          # Express.js backend
│   ├── src/
│   │   ├── config/       # DB, Redis, Cloudinary, OAuth
│   │   ├── controllers/  # Request handlers
│   │   ├── models/       # Mongoose schemas
│   │   ├── routes/       # API routes (v1)
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Auth, cache, rate‑limiting, error handling
│   │   ├── utils/        # Validators, helpers, errors
│   │   └── jobs/         # Cron jobs
│   ├── tests/            # Unit & integration tests
│   ├── scripts/          # Seed, backup, cleanup
│   ├── Dockerfile
│   ├── railway.toml
│   └── package.json
└── frontend/         # Next.js frontend
├── src/
│   ├── app/          # App router pages
│   ├── features/     # Feature‑based modules (auth, user, question, etc.)
│   ├── shared/       # Reusable components, hooks, lib, types, styles
│   ├── providers/    # Context providers
│   └── middleware.ts # Auth middleware
├── public/
└── package.json

```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- MongoDB 7.0+ (local or Atlas)
- Redis 7.2+ (local or Redis Cloud)
- Cloudinary account (for avatar uploads)
- Google and GitHub OAuth credentials

### Backend Setup

```bash
git clone https://github.com/anupam6335/DevRhythm.git
cd DevRhythm/backend
npm install
cp .env.example .env   # edit with your own values
npm run dev            # starts on http://localhost:5000
```

For detailed backend instructions, see backend/README.md.

Frontend Setup

```bash
cd ../frontend
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_BASE_URL
npm run dev                         # starts on http://localhost:4000
```

For detailed frontend instructions, see frontend/README.md.

---

🧪 Testing

Backend

```bash
cd backend
npm test                 # run all tests
npm run test:watch       # watch mode
npm run test:ci          # CI mode with coverage
```

Frontend

```bash
cd frontend
npm run lint             # ESLint
npm run format           # Prettier
```

---

🚢 Deployment

Backend (Railway)

1. Push your code to a GitHub repository.
2. Create a new project on Railway and connect the repo.
3. Set all environment variables from .env.example.
4. Railway automatically uses the provided Dockerfile and railway.toml.

Frontend (Vercel)

1. Connect your frontend directory to Vercel.
2. Add the environment variables (NEXT_PUBLIC_API_BASE_URL, etc.).
3. Deploy – Vercel automatically detects Next.js.

---

📚 API Documentation

Interactive API documentation is available as a Postman collection (in backend/postman).
After starting the backend, you can explore endpoints via:

```
GET http://localhost:5000/api/v1/health
```

All responses follow a consistent format:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": { ... },
  "meta": { ... },
  "error": null
}
```

For detailed request/response schemas, see the shared TypeScript types – these are used by both frontend and backend.

---

🎨 Design & Theming

DevRhythm features two carefully crafted themes for optimal readability and eye comfort.

· Zen Paper (Light) – warm, paper‑like background.
· Zen Charcoal (Dark) – soft charcoal for night coding.

All colors, fonts, and spacing are defined as CSS variables, making theming consistent and easy to extend. The heatmap uses a GitHub‑inspired colour scale (green intensity).

Font Role Font Family
Body Commissioner
Headings Outfit
Code Cascadia Mono
Notes Patrick Hand

---

🤝 Contributing

We ❤️ contributions! Whether it’s a bug report, feature idea, or pull request – you're welcome.

1. Fork the repository.
2. Create a feature branch (git checkout -b feature/amazing).
3. Commit your changes (git commit -m 'Add amazing feature').
4. Push to the branch (git push origin feature/amazing).
5. Open a Pull Request.

Please read our Contributing Guidelines for code style, commit messages, and testing requirements.

---

📄 License

This project is licensed under the MIT License – see the LICENSE file for details.

---

🙌 Acknowledgements

· Inspired by GitHub’s contribution graph and Anki’s spaced repetition.
· Fonts: Commissioner, Outfit, Patrick Hand, Cascadia Code.
· Icons: React Icons (Feather, Font Awesome).

---

<p align="center">
  <strong>Keep your coding rhythm. 🥁</strong>
</p>

<!-- 
<p align="center">
  <a href="https://devrhythm.vercel.app">devrhythm.vercel.app</a> · 
  <a href="https://twitter.com/devrhythm">@devrhythm</a> · 
  <a href="mailto:hello@devrhythm.com">hello@devrhythm.com</a>
