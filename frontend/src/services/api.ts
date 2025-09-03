// API Service - Main API client
import { API_CONFIG } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from './authService';
import { getUserTimezone } from '../utils/timezone';

class ApiService {
  private baseURL: string;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<void> | null = null;

  constructor() {
    this.baseURL = API_CONFIG.API_BASE;
  }

  private async getAuthHeaders() {
    await this.ensureTokenValid();
    const token = await AsyncStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }
  
  private async ensureTokenValid() {
    // If already refreshing, wait for it to complete
    if (this.isRefreshing && this.refreshPromise) {
      await this.refreshPromise;
      return;
    }
    
    const tokenExpiresAt = await AsyncStorage.getItem('tokenExpiresAt');
    
    if (!tokenExpiresAt) return;
    
    const expiresAt = parseInt(tokenExpiresAt);
    
    // Check if token expires in less than 5 minutes
    if (Date.now() > expiresAt - (5 * 60 * 1000)) {
      this.isRefreshing = true;
      
      this.refreshPromise = this.refreshToken();
      
      try {
        await this.refreshPromise;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    }
  }
  
  private async refreshToken() {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await authService.refreshToken(refreshToken);
      const tokenExpiresAt = Date.now() + (response.expires_in * 1000);
      
      await AsyncStorage.setItem('token', response.access_token);
      await AsyncStorage.setItem('refreshToken', response.refresh_token);
      await AsyncStorage.setItem('tokenExpiresAt', tokenExpiresAt.toString());
    } catch (error) {
      // If refresh fails, clear auth and throw
      await AsyncStorage.multiRemove(['token', 'refreshToken', 'tokenExpiresAt', 'user']);
      throw error;
    }
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      // If unauthorized and not already refreshing, try to refresh token
      if (response.status === 401 && !this.isRefreshing) {
        try {
          await this.refreshToken();
          // Token refreshed, caller should retry the request
          throw new Error('TOKEN_REFRESHED_RETRY');
        } catch (refreshError) {
          // Refresh failed, clear auth
          await AsyncStorage.multiRemove(['token', 'refreshToken', 'tokenExpiresAt', 'user']);
          throw new Error('Session expired, please login again');
        }
      }
      
      const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
      throw new Error(error.detail || 'An error occurred');
    }
    return response.json();
  }

  async get(endpoint: string, retryCount = 0): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers
      });
      return await this.handleResponse(response);
    } catch (error: any) {
      if (error.message === 'TOKEN_REFRESHED_RETRY' && retryCount < 1) {
        // Retry once after token refresh
        return this.get(endpoint, retryCount + 1);
      }
      throw error;
    }
  }

  async post(endpoint: string, data: any, retryCount = 0): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      return await this.handleResponse(response);
    } catch (error: any) {
      if (error.message === 'TOKEN_REFRESHED_RETRY' && retryCount < 1) {
        return this.post(endpoint, data, retryCount + 1);
      }
      throw error;
    }
  }

  async put(endpoint: string, data: any, retryCount = 0): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
      });
      return await this.handleResponse(response);
    } catch (error: any) {
      if (error.message === 'TOKEN_REFRESHED_RETRY' && retryCount < 1) {
        return this.put(endpoint, data, retryCount + 1);
      }
      throw error;
    }
  }

  async delete(endpoint: string, retryCount = 0): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'DELETE',
        headers
      });
      return await this.handleResponse(response);
    } catch (error: any) {
      if (error.message === 'TOKEN_REFRESHED_RETRY' && retryCount < 1) {
        return this.delete(endpoint, retryCount + 1);
      }
      throw error;
    }
  }
}

export const apiService = new ApiService();

// Notes API
export const notesAPI = {
  getDailyNotes: (date: string) => apiService.get(`/notes/daily/${date}`),
  getNotesRange: (startDate: string, endDate: string) => 
    apiService.get(`/notes/range?start_date=${startDate}&end_date=${endDate}`),
  getNoteById: (noteId: string) => apiService.get(`/notes/${noteId}`)
};

// Reviews API  
export const reviewsAPI = {
  getDailyReview: (date: string) => apiService.get(`/reviews/daily/${date}`),
  getWeeklyReview: (date: string) => apiService.get(`/reviews/weekly/${date}`),
  getReviewHistory: (skip: number = 0, limit: number = 50, type?: 'daily' | 'weekly') => {
    let url = `/reviews/history?skip=${skip}&limit=${limit}`;
    if (type) {
      url += `&review_type=${type}`;
    }
    return apiService.get(url);
  },
  getReviewById: (reviewId: string) => apiService.get(`/reviews/${reviewId}`),
  generateDailyReview: (date?: string) => {
    const timezone = getUserTimezone();
    const body = {
      timezone,
      ...(date && { target_date: date })
    };
    return apiService.post('/reviews/generate/daily', body);
  }
};

// Users API
export const usersAPI = {
  getCurrentUser: () => apiService.get('/users/me'),
  updateProfile: (data: any) => apiService.put('/users/me', data),
  createGoals: (goals: any) => apiService.put('/users/create_goals', goals),
  getReviewSchedule: () => apiService.get('/users/review-schedule'),
  updateReviewSchedule: (data: { time: string; timezone: string }) => 
    apiService.put('/users/review-schedule', data),
  disableReviewSchedule: () => apiService.delete('/users/review-schedule')
};

export default apiService;