<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/3fa4d2aa-4e89-4e0d-a7e6-0a2f4da8dbfb">
    <source media="(prefers-color-scheme: light)" srcset="https://github.com/user-attachments/assets/3fa4d2aa-4e89-4e0d-a7e6-0a2f4da8dbfb">
    <img alt="DevRhythm Logo" src="https://github.com/user-attachments/assets/3fa4d2aa-4e89-4e0d-a7e6-0a2f4da8dbfb" width="120" height="120">
  </picture>
</p>

<h1 align="center">DevRhythm Backend</h1>

[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)]()
[![NPM Version](https://img.shields.io/badge/npm-%3E%3D9.0.0-blue)]()
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![Test Coverage](https://img.shields.io/badge/coverage-85%25-yellowgreen)]()
[![CodeQL](https://img.shields.io/badge/CodeQL-passing-brightgreen)]()
[![Dependencies](https://img.shields.io/badge/dependencies-up%20to%20date-brightgreen)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)]()
[![Last Commit](https://img.shields.io/badge/last%20commit-today-blue)]()
[![Open Issues](https://img.shields.io/badge/issues-0-success)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)]()
[![Code Style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)]()
[![Linter: ESLint](https://img.shields.io/badge/linter-eslint-blue)]()
[![Documentation](https://img.shields.io/badge/docs-swagger-blue)]()
[![Made with ❤️ by DevRhythm](https://img.shields.io/badge/made%20with%20%E2%9D%A4%EF%B8%8F-DevRhythm-red)]()

> A comprehensive backend service for the DevRhythm platform, providing APIs for tracking coding progress, managing revision schedules, analyzing patterns, and fostering community engagement through study groups and leaderboards.

---

## Features

- **Authentication & Authorization** – OAuth 2.0 with Google and GitHub, session management, JWT tokens.
- **Progress Tracking** – Log solved problems from platforms like LeetCode, Codeforces, HackerRank; track attempts, time spent, confidence level.
- **Spaced Repetition Revisions** – Automatic scheduling of revisions with configurable intervals (1, 3, 7, 14, 30 days).
- **Heatmap Visualizations** – Yearly activity heatmaps with filtering by difficulty, platform, and activity type.
- **Pattern Mastery** – Analyse and improve proficiency in coding patterns; get recommendations for weak areas.
- **Goal Setting** – Create daily/weekly goals, track progress, and receive milestone notifications.
- **Study Groups** – Form groups, create shared goals and challenges, monitor group activity and leaderboards.
- **Social Features** – Follow other users, view public activity feeds, share progress snapshots.
- **Leaderboards** – Weekly and monthly rankings based on problems solved, consistency, and streaks.
- **Notifications** – In-app and email reminders for revisions, goal completions, new followers, and weekly reports.
- **Performance & Scalability** – Redis caching, Bull job queues, rate limiting, and database indexing.

---

## Technology Stack

| Layer          | Technologies                                                                 |
|----------------|------------------------------------------------------------------------------|
| **Runtime**    | Node.js (v18+)                                                               |
| **Framework**  | Express.js                                                                   |
| **Database**   | MongoDB with Mongoose ODM                                                    |
| **Caching**    | Redis (session store, API caching, rate limiting)                            |
| **Queue**      | Bull (Redis-based background jobs)                                           |
| **Auth**       | Passport.js (Google OAuth 2.0, GitHub OAuth)                                |
| **Validation** | Joi                                                                          |
| **Logging**    | Winston + Morgan                                                             |
| **Testing**    | Jest, Supertest                                                              |
| **Security**   | Helmet, CORS, compression, express-rate-limit                                |
| **File Upload**| Cloudinary (via multer)                                                      |
| **Email**      | Nodemailer                                                                   |
| **PDF**        | PDFKit                                                                       |

---

## Project Structure

```
src/
├── config/           # Configuration modules (database, redis, cloudinary, oauth, constants)
├── controllers/      # Request handlers for each feature
├── jobs/             # Cron jobs for periodic tasks (leaderboards, notifications, snapshots)
├── middleware/       # Auth, cache, rate limiter, error handler, logger, validator
├── models/           # Mongoose models
├── routes/           # API route definitions (v1)
├── services/         # Business logic, queue handlers, external integrations
├── utils/            # Helpers, constants, custom errors, validators
└── server.js         # Application entry point
```

---

## API Documentation

Interactive API documentation is available via Swagger UI at `/api-docs` when the server is running.  
For detailed endpoint specifications (request/response formats, authentication requirements), refer to the internal Postman collection or OpenAPI specification (accessible to the development team only).

---

## Getting Started

This project is intended for **internal development and deployment** by the DevRhythm team.  
Setup instructions, environment configuration, and deployment guidelines are maintained in the internal developer documentation.  
If you are a team member, please refer to the project wiki or contact the lead developer for access.

---

## Contributing

Contributions from team members are welcome. Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting pull requests.

- Fork the repository (if applicable)
- Create a feature branch (`git checkout -b feature/amazing-feature`)
- Commit your changes (`git commit -m 'Add some amazing feature'`)
- Push to the branch (`git push origin feature/amazing-feature`)
- Open a Pull Request

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Note**: This README is for internal use only and does not include any sensitive configuration details. All environment variables and setup procedures are documented separately.

## 📫 Contact

- **Project Repository:**  https://github.com/anupam6335/DevRhythm
- **Maintainer:** Anupam Debnath
- Linkdin : https://linkedin.com/in/anupam-debnath-364b2619a
- Leetcode : https://leetcode.com/u/anupam_nlogn/ 
---

*Made with ❤️ by the DevRhythm Team*
