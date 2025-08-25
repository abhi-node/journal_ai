// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000',
  TIMEOUT: 30000,
  ENDPOINTS: {
    // Auth
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      REFRESH: '/auth/refresh',
      LOGOUT: '/auth/logout',
    },
    // Notes
    NOTES: {
      TRANSCRIBE: '/notes/transcribe',
      ADD: '/notes/add',
      DAILY: '/notes/daily',
      RANGE: '/notes/range',
    },
    // Reviews
    REVIEWS: {
      DAILY: '/reviews/daily',
      WEEKLY: '/reviews/weekly',
      GENERATE_DAILY: '/reviews/generate/daily',
      GENERATE_WEEKLY: '/reviews/generate/weekly',
      HISTORY: '/reviews/history',
    },
    // Users
    USERS: {
      PROFILE: '/users/profile',
      GOALS: '/users/goals',
      STATS: '/users/stats',
      ONBOARDING: '/users/onboarding',
    },
    // Tasks
    TASKS: {
      ACTIVE: '/tasks/active',
      DAILY: '/tasks/daily',
      COMPLETE: '/tasks/complete',
      HISTORY: '/tasks/history',
    },
  },
};