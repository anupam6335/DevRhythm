# DevRhythm Backend

Production-ready backend for DevRhythm - A coding productivity and progress tracking platform.

## Features

- OAuth2 Authentication (Google & GitHub)
- User Profile Management with Streak System
- Progress Tracking & Analytics
- Revision Scheduling with Spaced Repetition
- Goal Setting & Motivation Systems
- Social Features (Follow/Unfollow, Leaderboards)
- Notification System
- Heatmap Visualization
- Data Export Options

## Tech Stack

- **Backend:** Node.js + Express.js
- **Database:** MongoDB
- **Cache:** Redis
- **Storage:** Cloudinary (for PDFs, images, code JSON)
- **API Style:** REST exclusively
- **Language:** JavaScript (ES6+)

## Deployment

Deployed on Railway with horizontal scaling architecture.

## Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and configure environment variables
4. Start development server: `npm run dev`
5. Access the API at `http://localhost:5000`

## Environment Variables

See `.env.example` for all required environment variables.

## API Documentation

Base URL: `/api/v1`

### Health Check
```
GET /api/v1/health
```

### Authentication Endpoints
```
GET    /api/v1/auth/google
GET    /api/v1/auth/google/callback
GET    /api/v1/auth/github
GET    /api/v1/auth/github/callback
POST   /api/v1/auth/logout
GET    /api/v1/auth/session
POST   /api/v1/auth/refresh
GET    /api/v1/auth/providers
```

### User Endpoints
```
GET    /api/v1/users/me
PUT    /api/v1/users/me
GET    /api/v1/users/me/stats
PUT    /api/v1/users/me/last-online
DELETE /api/v1/users/me
GET    /api/v1/users/search?q=term
GET    /api/v1/users/top/streaks
GET    /api/v1/users/top/solved
GET    /api/v1/users/:username
GET    /api/v1/users/:username/availability
```

## Database Schema

### User
- OAuth2 authentication (Google/GitHub)
- Profile information
- Streak system
- Statistics overview
- Study preferences
- Privacy settings

### ProgressSnapshot
- Overall progress tracking
- Consistency & habits analysis
- Performance metrics
- Difficulty analysis
- Pattern mastery
- Personalized insights

### Notification
- Revision reminders
- Goal tracking alerts
- Social interactions
- Weekly reports

### LeaderboardSnapshot
- Weekly/Monthly rankings
- Pre-computed scores
- Performance metrics

## Architecture

- Horizontal scaling with multiple Express instances
- Railway Load Balancer with least connections algorithm
- MongoDB Atlas with replica sets
- Redis for session storage and caching
- Cloudinary for file storage
- Automated background jobs for leaderboards, notifications, and snapshots

## Monitoring

- Health check endpoint for load balancer
- Request/Response logging with Winston
- Error tracking and handling
- Performance monitoring
- Database connection pooling

## License

MIT
