const constants = {
  API: {
    VERSION: 'v1',
    BASE_URL: '/api/v1',
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100
  },

  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504
  },

  ERROR_CODES: {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
    NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
    CONFLICT_ERROR: 'CONFLICT_ERROR',
    RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR'
  },

  QUESTION: {
    DIFFICULTY: {
      EASY: 'easy',
      MEDIUM: 'medium',
      HARD: 'hard'
    },
    
    STATUS: {
      PENDING: 'pending',
      DONE: 'done',
      NOT_SOLVED: 'not-solved',
      PARTIALLY_SOLVED: 'partially-solved',
      NEED_HELP: 'need-help'
    },
    
    PLATFORMS: {
      LEETCODE: 'leetcode',
      CODEFORCES: 'codeforces',
      HACKERRANK: 'hackerrank',
      ATCODER: 'atcoder',
      CODEWARS: 'codewars',
      CUSTOM: 'custom',
      OTHER: 'other'
    }
  },

  DAY: {
    TYPES: {
      LEARNING: 'learning',
      REVISION: 'revision',
      MOCK: 'mock',
      REST: 'rest',
      ASSESSMENT: 'assessment'
    }
  },

  REVISION: {
    INTERVALS: {
      SAME_DAY: 'sameDay',
      DAY_3: 'day3',
      DAY_7: 'day7',
      DAY_14: 'day14',
      DAY_30: 'day30'
    },
    
    STATUS: {
      ACTIVE: 'active',
      PAUSED: 'paused',
      COMPLETED: 'completed',
      OVERDUE: 'overdue'
    }
  },

  ACHIEVEMENT: {
    TYPES: {
      STREAK: 'streak',
      QUESTIONS_SOLVED: 'questions-solved',
      REVISIONS_COMPLETED: 'revisions-completed',
      TIME_SPENT: 'time-spent',
      TOPIC_MASTERY: 'topic-mastery',
      DIFFICULTY_CONQUERED: 'difficulty-conquered',
      CONSISTENCY: 'consistency',
      SPEED: 'speed',
      MILESTONE: 'milestone',
      CHALLENGE: 'challenge',
      SPECIAL: 'special'
    },
    
    TIERS: {
      BRONZE: 'bronze',
      SILVER: 'silver',
      GOLD: 'gold',
      PLATINUM: 'platinum',
      DIAMOND: 'diamond'
    }
  },

  NOTIFICATION: {
    CATEGORIES: {
      DAILY_STUDY: 'daily-study',
      REVISION: 'revision',
      PROGRESS_MOTIVATION: 'progress-motivation',
      TIMER_QUESTION: 'timer-question',
      STUDY_PLAN: 'study-plan',
      KNOWLEDGE_MAP: 'knowledge-map',
      SYSTEM_ACCOUNT: 'system-account',
      ACHIEVEMENT: 'achievement'
    },
    
    CHANNELS: {
      IN_APP: 'in-app',
      EMAIL: 'email',
      PUSH: 'push',
      BROWSER: 'browser'
    },
    
    PRIORITY: {
      HIGH: 'high',
      MEDIUM: 'medium',
      LOW: 'low'
    }
  },

  STUDY_PLAN: {
    TYPES: {
      PREDEFINED: 'predefined',
      CUSTOM: 'custom',
      COMPANY_SPECIFIC: 'company-specific',
      TOPIC_BASED: 'topic-based',
      ADAPTIVE: 'adaptive'
    },
    
    GOAL_TYPES: {
      INTERVIEW: 'interview',
      COMPETITION: 'competition',
      SKILL: 'skill',
      PROMOTION: 'promotion'
    },
    
    TIMEFRAMES: {
      THIRTY_DAY: '30-day',
      SIXTY_DAY: '60-day',
      NINETY_DAY: '90-day',
      CUSTOM: 'custom'
    }
  },

  KNOWLEDGE_GRAPH: {
    NODE_TYPES: {
      TOPIC: 'topic',
      SUBTOPIC: 'subtopic',
      CONCEPT: 'concept',
      QUESTION: 'question',
      SKILL: 'skill',
      PREREQUISITE: 'prerequisite'
    },
    
    EDGE_TYPES: {
      PREREQUISITE: 'prerequisite',
      RELATED: 'related',
      CHILD_PARENT: 'child-parent',
      SIMILAR: 'similar',
      DEPENDENCY: 'dependency'
    },
    
    MASTERY_LEVELS: {
      NOVICE: 'novice',
      BEGINNER: 'beginner',
      INTERMEDIATE: 'intermediate',
      ADVANCED: 'advanced',
      MASTER: 'master'
    }
  },

  TIMER: {
    STATUS: {
      RUNNING: 'running',
      PAUSED: 'paused',
      STOPPED: 'stopped',
      COMPLETED: 'completed'
    },
    
    SEGMENT_TYPES: {
      THINKING: 'thinking',
      CODING: 'coding',
      DEBUGGING: 'debugging',
      BREAK: 'break',
      REVIEW: 'review'
    }
  },

  USER: {
    PREFERENCES: {
      DIFFICULTY_PROGRESSION: {
        SEQUENTIAL: 'sequential',
        MIXED: 'mixed'
      },
      
      STUDY_INTENSITY: {
        LIGHT: 'light',
        MODERATE: 'moderate',
        INTENSE: 'intense'
      },
      
      THEMES: {
        LIGHT: 'light',
        DARK: 'dark',
        AUTO: 'auto'
      },
      
      DENSITY: {
        COMPACT: 'compact',
        COMFORTABLE: 'comfortable',
        SPACIOUS: 'spacious'
      }
    }
  },

  CACHE: {
    TTL: {
      SHORT: 300, // 5 minutes
      MEDIUM: 1800, // 30 minutes
      LONG: 7200, // 2 hours
      VERY_LONG: 86400 // 24 hours
    },
    
    KEYS: {
      USER_PROFILE: 'user:profile',
      USER_STATS: 'user:stats',
      QUESTION_STATS: 'question:stats',
      DAY_STATS: 'day:stats',
      KNOWLEDGE_GRAPH: 'knowledge:graph',
      STUDY_PLAN: 'study:plan'
    }
  },

  VALIDATION: {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
    OBJECT_ID: /^[0-9a-fA-F]{24}$/,
    TIMEZONE: /^[A-Za-z_]+\/[A-Za-z_]+$/,
    DATE_FORMAT: /^\d{4}-\d{2}-\d{2}$/,
    DATETIME_FORMAT: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/
  },

  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
  },

  FILE: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.txt', '.md'],
    ALLOWED_MIME_TYPES: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
      'text/markdown'
    ]
  },

  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
    MESSAGE: 'Too many requests from this IP, please try again later.'
  },

  SECURITY: {
    PASSWORD_MIN_LENGTH: 8,
    SESSION_MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days
    JWT_EXPIRY: '7d',
    JWT_REFRESH_EXPIRY: '30d',
    CSRF_ENABLED: true,
    CSP_ENABLED: true,
    HSTS_ENABLED: true
  },

  TIME: {
    MILLISECONDS: {
      SECOND: 1000,
      MINUTE: 60 * 1000,
      HOUR: 60 * 60 * 1000,
      DAY: 24 * 60 * 60 * 1000,
      WEEK: 7 * 24 * 60 * 60 * 1000
    },
    
    SECONDS: {
      MINUTE: 60,
      HOUR: 3600,
      DAY: 86400,
      WEEK: 604800
    }
  },

  ANALYTICS: {
    PERIOD_TYPES: {
      DAILY: 'daily',
      WEEKLY: 'weekly',
      MONTHLY: 'monthly',
      YEARLY: 'yearly',
      CUSTOM: 'custom'
    }
  },

  ENVIRONMENT: {
    DEVELOPMENT: 'development',
    PRODUCTION: 'production',
    TEST: 'test'
  }
};

Object.freeze(constants);
Object.freeze(constants.API);
Object.freeze(constants.HTTP_STATUS);
Object.freeze(constants.ERROR_CODES);
Object.freeze(constants.QUESTION);
Object.freeze(constants.QUESTION.DIFFICULTY);
Object.freeze(constants.QUESTION.STATUS);
Object.freeze(constants.QUESTION.PLATFORMS);
Object.freeze(constants.DAY);
Object.freeze(constants.DAY.TYPES);
Object.freeze(constants.REVISION);
Object.freeze(constants.REVISION.INTERVALS);
Object.freeze(constants.REVISION.STATUS);
Object.freeze(constants.ACHIEVEMENT);
Object.freeze(constants.ACHIEVEMENT.TYPES);
Object.freeze(constants.ACHIEVEMENT.TIERS);
Object.freeze(constants.NOTIFICATION);
Object.freeze(constants.NOTIFICATION.CATEGORIES);
Object.freeze(constants.NOTIFICATION.CHANNELS);
Object.freeze(constants.NOTIFICATION.PRIORITY);
Object.freeze(constants.STUDY_PLAN);
Object.freeze(constants.STUDY_PLAN.TYPES);
Object.freeze(constants.STUDY_PLAN.GOAL_TYPES);
Object.freeze(constants.STUDY_PLAN.TIMEFRAMES);
Object.freeze(constants.KNOWLEDGE_GRAPH);
Object.freeze(constants.KNOWLEDGE_GRAPH.NODE_TYPES);
Object.freeze(constants.KNOWLEDGE_GRAPH.EDGE_TYPES);
Object.freeze(constants.KNOWLEDGE_GRAPH.MASTERY_LEVELS);
Object.freeze(constants.TIMER);
Object.freeze(constants.TIMER.STATUS);
Object.freeze(constants.TIMER.SEGMENT_TYPES);
Object.freeze(constants.USER);
Object.freeze(constants.USER.PREFERENCES);
Object.freeze(constants.USER.PREFERENCES.DIFFICULTY_PROGRESSION);
Object.freeze(constants.USER.PREFERENCES.STUDY_INTENSITY);
Object.freeze(constants.USER.PREFERENCES.THEMES);
Object.freeze(constants.USER.PREFERENCES.DENSITY);
Object.freeze(constants.CACHE);
Object.freeze(constants.CACHE.TTL);
Object.freeze(constants.CACHE.KEYS);
Object.freeze(constants.VALIDATION);
Object.freeze(constants.PAGINATION);
Object.freeze(constants.FILE);
Object.freeze(constants.RATE_LIMIT);
Object.freeze(constants.SECURITY);
Object.freeze(constants.TIME);
Object.freeze(constants.TIME.MILLISECONDS);
Object.freeze(constants.TIME.SECONDS);
Object.freeze(constants.ANALYTICS);
Object.freeze(constants.ANALYTICS.PERIOD_TYPES);
Object.freeze(constants.ENVIRONMENT);

module.exports = constants;