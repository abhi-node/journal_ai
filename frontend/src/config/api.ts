export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000',
  API_VERSION: process.env.EXPO_PUBLIC_API_VERSION || 'v1',
  get API_BASE() {
    return `${this.BASE_URL}/api/${this.API_VERSION}`;
  },
  get WS_BASE() {
    const wsProtocol = this.BASE_URL.startsWith('https') ? 'wss' : 'ws';
    const wsUrl = this.BASE_URL.replace(/^https?/, wsProtocol);
    return `${wsUrl}/api/${this.API_VERSION}`;
  },
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      SIGNUP: '/auth/signup',
    },
  },
};