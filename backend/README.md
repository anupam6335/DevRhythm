# DevRhythm Backend

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Google OAuth](https://img.shields.io/badge/Google_OAuth-4285F4?style=for-the-badge&logo=google&logoColor=white)
![GitHub OAuth](https://img.shields.io/badge/GitHub_OAuth-181717?style=for-the-badge&logo=github&logoColor=white)
![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B3263?style=for-the-badge&logo=eslint&logoColor=white)
![Prettier](https://img.shields.io/badge/Prettier-F7B93E?style=for-the-badge&logo=prettier&logoColor=black)

> Backend for DevRhythm — A comprehensive coding productivity platform with advanced question management, progress tracking, and spaced repetition systems.

## ✨ Features

### **Authentication & User Management**
- ✅ **OAuth2 Authentication** — Google & GitHub integration
- ✅ **User Profiles** — Streak system, statistics dashboard, study preferences
- ✅ **Privacy Controls** — Public/Private/Link-only sharing options
- ✅ **Account Management** — Complete CRUD operations with secure sessions

### **Question Management System**
- ✅ **Unlimited Questions** — No daily limits with complete CRUD operations
- ✅ **Multi-Platform Support** — LeetCode, Codeforces, HackerRank, AtCoder, CodeChef
- ✅ **Advanced Filtering** — Search by difficulty, pattern, tags, platform, and full-text
- ✅ **Soft Delete & Recovery** — Restorable deletions with permanent delete option
- ✅ **Question Analytics** — Statistics, pattern tracking, tag management

### **Learning & Productivity**
- ✅ **Spaced Repetition** — Automated revision scheduling (Day 1, 3, 7, 14, 30)
- ✅ **Progress Tracking** — Daily/weekly views with heatmap visualization
- ✅ **Goal Setting** — Custom daily/weekly targets with completion tracking
- ✅ **Streak System** — Current and longest streak records with streak analytics

### **Social & Collaboration**
- ✅ **Follow System** — Follow/unfollow other developers
- ✅ **Leaderboards** — Weekly/monthly rankings by solved count and consistency
- ✅ **Study Groups** — Create/join groups with shared goals and challenges

### **Notification & Insights**
- ✅ **Smart Reminders** — Revision notifications, goal tracking, streak maintenance
- ✅ **Weekly Reports** — Automated progress summaries and insights
- ✅ **Social Alerts** — New followers and group activity notifications

## 🏗️ System Architecture

### **Deployment Architecture**
```
┌────────────────────────────────────────────────────────────┐
│                    Railway Platform                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │               Load Balancer (Built-in)             │    │
│  │        • Least Connections Algorithm               │    │
│  │        • Auto SSL Termination                      │    │
│  │        • Health Checks Every 10s                   │    │
│  └──────────┬────────────────┬────────────────┬───────┘    │
│             │                │                │            │
│    ┌────────▼──┐    ┌───────▼──┐    ┌────────▼──┐          │
│    │ Express   │    │ Express  │    │ Express   │          │
│    │ Instance  │    │ Instance │    │ Instance  │          │
│    │ #1 (500MB)│    │ #2 (500MB)│   │ #3 (500MB)│          │
│    └─────┬─────┘    └────┬─────┘    └─────┬─────┘          │
│          │               │                │                │
│          └───────────────┼────────────────┘                │
│                          │                                 │
│                 ┌────────▼────────┐                        │
│                 │   Redis Cache   │                        │
│                 │  • Sessions     │                        │
│                 │  • API Cache    │                        │
│                 │  • Rate Limits  │                        │
│                 └────────┬────────┘                        │
│                          │                                 │
│                 ┌────────▼────────┐                        │
│                 │  MongoDB Atlas  │                        │
│                 │  • M0 Free Tier │                        │
│                 │  • Replica Set  │                        │
│                 │  • Read Scaling │                        │
│                 └────────┬────────┘                        │
│                          │                                 │
│                 ┌────────▼────────┐                        │
│                 │   Cloudinary    │                        │
│                 │  • File Storage │                        │
│                 │  • CDN Delivery │                        │
│                 └─────────────────┘                        │
└────────────────────────────────────────────────────────────┘
```

### **Horizontal Scaling Strategy**
- **Auto-scaling**: 2-3 instances based on CPU/memory utilization
- **Stateless Design**: All sessions stored in Redis, no local file storage
- **Connection Pooling**: MongoDB connection pooling with 500 max connections
- **Read Scaling**: Secondary preferred read preference for MongoDB replica sets

### **Caching Strategy**
```javascript
// Redis Key Patterns
devrhythm:cache:questions:list:{hash}      // 5 minutes TTL
devrhythm:cache:question:{id}              // 1 hour TTL  
devrhythm:cache:questions:patterns         // 30 minutes TTL
devrhythm:cache:questions:tags             // 30 minutes TTL
devrhythm:cache:questions:statistics       // 1 hour TTL
devrhythm:ratelimit:{ip}:{endpoint}        // 15 minutes window
devrhythm:session:{sessionId}              // 24 hours TTL
```

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ 
- MongoDB (Atlas or local instance)
- Redis (Cloud or local instance)
- Cloudinary account (for file storage)

### **Installation**
```bash
# Clone repository
git clone https://github.com/anupam6335/DevRhythm
cd devrhythm-backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev

# Seed database with test data (optional)
npm run seed
```

### **Development**
```bash
# Start development server with hot reload
npm run dev

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Lint code
npm run lint

# Format code
npm run format
```

## 📚 API Reference

### **Base URL**
```
http://localhost:5000/api/v1 [ For now ]
```

### **Response Format**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": {},
  "meta": {},
  "error": null
}
```

### **Endpoints Overview**

#### **Authentication**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/auth/google` | Initiate Google OAuth | No |
| GET | `/auth/github` | Initiate GitHub OAuth | No |
| GET | `/auth/providers` | List available auth providers | No |
| POST | `/auth/logout` | Logout user | Yes |
| GET | `/auth/session` | Validate current session | Yes |

#### **User Management**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users/me` | Get current user profile | Yes |
| PUT | `/users/me` | Update user profile | Yes |
| GET | `/users/me/stats` | Get user statistics | Yes |
| DELETE | `/users/me` | Delete account | Yes |
| GET | `/users/search` | Search users by username | Yes |
| GET | `/users/top/streaks` | Top users by streak | Yes |

#### **Question Management**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/questions` | List questions with filters | Yes |
| POST | `/questions` | Create new question | Yes (Admin) |
| GET | `/questions/:id` | Get specific question | Yes |
| PUT | `/questions/:id` | Update question | Yes (Admin) |
| DELETE | `/questions/:id` | Soft delete question | Yes (Admin) |
| POST | `/questions/:id/restore` | Restore deleted question | Yes (Admin) |
| DELETE | `/questions/:id/permanent` | Permanent delete | Yes (Admin) |
| GET | `/questions/patterns` | Get all patterns | Yes |
| GET | `/questions/tags` | Get all tags | Yes |
| GET | `/questions/statistics` | Get question analytics | Yes |

#### **Progress & Analytics**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/progress/heatmap` | Yearly activity heatmap | Yes |
| GET | `/progress/snapshots` | Progress snapshots | Yes |
| GET | `/leaderboards/weekly` | Weekly leaderboard | Yes |
| GET | `/leaderboards/monthly` | Monthly leaderboard | Yes |

### **Query Parameters**

#### **Question Filtering**
```javascript
// GET /api/v1/questions
{
  page: 1,                    // Page number (default: 1)
  limit: 20,                  // Items per page (1-100)
  platform: "LeetCode",       // Filter by platform
  difficulty: "Medium",       // Easy/Medium/Hard
  pattern: "Two Pointers",    // Algorithm pattern
  tags: ["Array", "Hash"],    // Filter by tags (array or single)
  search: "binary search"     // Full-text search
}
```

#### **Pagination Response**
```json
{
  "success": true,
  "data": {
    "questions": [...]
  },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## 🗃️ Database Schema

### **Question Schema**
```javascript
{
  title: "Two Sum",
  problemLink: "https://leetcode.com/problems/two-sum/",
  platform: "LeetCode",               // ["LeetCode", "Codeforces", ...]
  platformQuestionId: "two-sum",      // Platform-specific identifier
  difficulty: "Easy",                 // ["Easy", "Medium", "Hard"]
  tags: ["Array", "Hash Table"],      // Categorization tags
  pattern: "Two Pointers",            // Algorithm pattern
  solutionLinks: ["https://..."],     // External resources
  similarQuestions: [ObjectId],       // Related questions
  contentRef: "cloudinary-url",       // File storage reference
  isActive: true,                     // Soft delete flag
  createdAt: Date,
  updatedAt: Date
}
```

### **Indexes**
```javascript
// Unique constraint per platform
{ platform: 1, platformQuestionId: 1 }

// Search optimization
{ title: "text", pattern: "text" }

// Filtering performance
{ difficulty: 1 }
{ pattern: 1 }
{ tags: 1 }
{ platform: 1, difficulty: 1, pattern: 1 }
```

## 🔧 Project Structure

```
devrhythm-backend/
├── src/
│   ├── config/                 # Configuration management
│   │   ├── database.js         # MongoDB connection
│   │   ├── redis.js           # Redis client
│   │   ├── cloudinary.js      # File storage
│   │   ├── oauth.js           # OAuth providers
│   │   └── constants.js       # Application constants
│   │
│   ├── models/                # MongoDB schemas
│   │   ├── User.js
│   │   ├── Question.js
│   │   ├── UserQuestionProgress.js
│   │   ├── RevisionSchedule.js
│   │   └── ... (12 more models)
│   │
│   ├── controllers/           # Business logic
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── question.controller.js
│   │   └── ... (15 more controllers)
│   │
│   ├── routes/               # API endpoints
│   │   └── v1/
│   │       ├── auth.routes.js
│   │       ├── user.routes.js
│   │       ├── question.routes.js
│   │       └── ... (15 more route files)
│   │
│   ├── middleware/           # Express middleware
│   │   ├── auth.js          # Authentication
│   │   ├── rateLimiter.js   # Rate limiting
│   │   ├── cache.js         # Response caching
│   │   ├── validator.js     # Request validation
│   │   └── errorHandler.js  # Error handling
│   │
│   ├── services/            # External service integrations
│   │   ├── cache.service.js
│   │   ├── notification.service.js
│   │   ├── leaderboard.service.js
│   │   └── export.service.js
│   │
│   ├── utils/               # Utility functions
│   │   ├── validators/      # Joi validation schemas
│   │   ├── helpers/         # Response, pagination, date helpers
│   │   ├── errors/          # Custom error classes
│   │   └── constants/       # HTTP status, user roles, etc.
│   │
│   └── jobs/               # Background jobs
│       ├── leaderboard.job.js
│       ├── notification.job.js
│       ├── progressSnapshot.job.js
│       └── index.js
│
├── tests/                  # Test suites
│   ├── unit/              # Unit tests
│   └── integration/       # Integration tests
│
├── scripts/               # Utility scripts
│   ├── seed.js           # Database seeding
│   ├── backup.js         # Backup utilities
│   └── cleanup.js        # Maintenance scripts
│
├── logs/                  # Application logs
└── Dockerfile            # Container configuration
```

## ⚡ Performance Optimization

### **Connection Pooling**
```javascript
// MongoDB Connection Settings
maxPoolSize: 500,          // Maximum connections
minPoolSize: 2,            // Minimum connections
serverSelectionTimeoutMS: 50000  // Connection timeout
```

### **Caching Strategy**
- **L1 Cache**: Redis for session storage (24h TTL)
- **L2 Cache**: Redis for API responses (300-3600s TTL)
- **CDN Cache**: Cloudinary for static assets
- **Browser Cache**: Cache-Control headers for static resources

### **Rate Limiting**
```javascript
// Request Limits per IP
GET Endpoints: 100 requests per 15 minutes
POST/PUT/DELETE: 50 requests per 15 minutes
OAuth Endpoints: 50 requests per 15 minutes
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage report
npm test -- --coverage

# Run specific test suite
npm test -- tests/integration/auth.test.js

# Watch mode for development
npm run test:watch

# Continuous Integration mode
npm run test:ci
```

## 🚢 Deployment

### **Railway Deployment**
```bash
# Automatic deployment configured via railway.toml
# Push to main branch triggers auto-deploy

# Manual deployment
railway up
```

### **Docker Deployment**
```bash
# Build image
docker build -t devrhythm-backend:latest .

# Run container
docker run -p 5000:5000 \
  --env-file .env \
  devrhythm-backend:latest
```

### **Health Checks**
```bash
# Health endpoint
GET /api/v1/health

# Response includes:
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "cloudinary": "connected",
  "uptime": 86400,
  "version": "1.0.0"
}
```

## 📈 Monitoring

### **Built-in Monitoring**
- **Health Checks**: Automatic monitoring every 10 seconds
- **Error Tracking**: Winston logger with error aggregation
- **Performance Metrics**: Response time tracking
- **Resource Usage**: CPU/Memory monitoring via Railway

### **Log Files**
```javascript
// Production logging with Winston
logs/error.log     // Error-level logs
logs/combined.log  // All application logs
```

## 🔄 Background Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| Leaderboard Updates | Weekly (Sunday 00:00) | Calculate weekly rankings |
| Progress Snapshots | Daily (00:00) | Daily progress tracking |
| Revision Reminders | Daily (09:00) | Send pending revision alerts |
| Weekly Reports | Weekly (Sunday 10:00) | Generate weekly progress reports |
| Cleanup Jobs | Daily (00:00) | Remove expired data |

## 🛡️ Security

### **Authentication**
- OAuth2 with Google and GitHub
- JWT token-based sessions (7-day expiry)
- Refresh token rotation (30-day expiry)
- Session storage in Redis

### **Data Protection**
- Input sanitization and validation
- HTTPS enforcement in production
- Secure cookie settings (HttpOnly, Secure, SameSite)
- Rate limiting to prevent abuse

### **Database Security**
- Connection pooling with limits
- Read-only replicas for analytics
- Regular backups via automated scripts
- Index optimization for query performance

## 📊 API Performance

| Endpoint | Avg Response | Cache TTL | Rate Limit |
|----------|-------------|-----------|------------|
| GET /questions | 50ms | 300s | 100/15min |
| GET /questions/:id | 20ms | 3600s | 100/15min |
| POST /questions | 100ms | N/A | 50/15min |
| GET /patterns | 30ms | 1800s | 100/15min |
| GET /tags | 30ms | 1800s | 100/15min |


## 🙏 Acknowledgments

- Built with modern best practices for production deployment
- Designed for horizontal scalability on Railway platform
- Inspired by productivity systems for developers
- Special thanks to the open-source community

---

**DevRhythm Backend** · Version 1.0.0 · [Report Bug](https://github.com/anupam6335/DevRhythm/issues) · [Request Feature](https://github.com/anupam6335/DevRhythm/issues)

---

<div align="center">
  <sub>Built with ❤️ for developers to track progress and stay consistent</sub>
</div>