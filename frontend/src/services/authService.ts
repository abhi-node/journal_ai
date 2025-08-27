import { API_CONFIG } from '../config/api';

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupData {
  email: string;
  password: string;
  name: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  goals: any;
  stats: any;
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const formData = new FormData();
      formData.append('username', credentials.email);
      formData.append('password', credentials.password);

      const response = await fetch(`${API_CONFIG.API_BASE}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async signup(userData: SignupData): Promise<User> {
    try {
      const response = await fetch(`${API_CONFIG.API_BASE}${API_CONFIG.ENDPOINTS.AUTH.SIGNUP}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Signup failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<RefreshResponse> {
    try {
      const response = await fetch(`${API_CONFIG.API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Token refresh failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  async logout(token: string): Promise<void> {
    try {
      const response = await fetch(`${API_CONFIG.API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails on server, we'll clear local data
    }
  }
}

export default new AuthService();