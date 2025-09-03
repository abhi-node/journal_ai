import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import authService from '../../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  goals: any;
  stats: any;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  tokenExpiresAt: number | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  tokenExpiresAt: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }) => {
    const response = await authService.login(credentials);
    const tokenExpiresAt = Date.now() + (response.expires_in * 1000);
    
    await AsyncStorage.setItem('token', response.access_token);
    await AsyncStorage.setItem('refreshToken', response.refresh_token);
    await AsyncStorage.setItem('tokenExpiresAt', tokenExpiresAt.toString());
    await AsyncStorage.setItem('user', JSON.stringify(response.user));
    
    return { ...response, tokenExpiresAt };
  }
);

export const signup = createAsyncThunk(
  'auth/signup',
  async (userData: { email: string; password: string; name: string; timezone: string }) => {
    const user = await authService.signup(userData);
    // After signup, automatically log them in
    const loginResponse = await authService.login({
      email: userData.email,
      password: userData.password,
    });
    const tokenExpiresAt = Date.now() + (loginResponse.expires_in * 1000);
    
    await AsyncStorage.setItem('token', loginResponse.access_token);
    await AsyncStorage.setItem('refreshToken', loginResponse.refresh_token);
    await AsyncStorage.setItem('tokenExpiresAt', tokenExpiresAt.toString());
    await AsyncStorage.setItem('user', JSON.stringify(loginResponse.user));
    
    return { ...loginResponse, tokenExpiresAt };
  }
);

export const loadStoredAuth = createAsyncThunk(
  'auth/loadStored',
  async () => {
    const token = await AsyncStorage.getItem('token');
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    const tokenExpiresAt = await AsyncStorage.getItem('tokenExpiresAt');
    const userString = await AsyncStorage.getItem('user');
    
    if (token && refreshToken && userString) {
      const expiresAt = tokenExpiresAt ? parseInt(tokenExpiresAt) : null;
      
      // Check if token is expired or about to expire (within 5 minutes)
      if (expiresAt && Date.now() > expiresAt - (5 * 60 * 1000)) {
        // Token expired or expiring soon, refresh it
        try {
          const response = await authService.refreshToken(refreshToken);
          const newExpiresAt = Date.now() + (response.expires_in * 1000);
          
          await AsyncStorage.setItem('token', response.access_token);
          await AsyncStorage.setItem('refreshToken', response.refresh_token);
          await AsyncStorage.setItem('tokenExpiresAt', newExpiresAt.toString());
          
          return {
            token: response.access_token,
            refreshToken: response.refresh_token,
            tokenExpiresAt: newExpiresAt,
            user: JSON.parse(userString),
          };
        } catch (error) {
          // Refresh failed, clear auth
          await AsyncStorage.multiRemove(['token', 'refreshToken', 'tokenExpiresAt', 'user']);
          return null;
        }
      }
      
      return {
        token,
        refreshToken,
        tokenExpiresAt: expiresAt,
        user: JSON.parse(userString),
      };
    }
    return null;
  }
);

export const refreshAuthToken = createAsyncThunk(
  'auth/refresh',
  async (_, { getState }) => {
    const state = getState() as { auth: AuthState };
    const { refreshToken } = state.auth;
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await authService.refreshToken(refreshToken);
    const tokenExpiresAt = Date.now() + (response.expires_in * 1000);
    
    await AsyncStorage.setItem('token', response.access_token);
    await AsyncStorage.setItem('refreshToken', response.refresh_token);
    await AsyncStorage.setItem('tokenExpiresAt', tokenExpiresAt.toString());
    
    return { ...response, tokenExpiresAt };
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      // Call logout endpoint if we have a token
      if (state.token) {
        authService.logout(state.token).catch(() => {});
      }
      
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.tokenExpiresAt = null;
      state.isAuthenticated = false;
      state.error = null;
      
      AsyncStorage.multiRemove(['token', 'refreshToken', 'tokenExpiresAt', 'user']);
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      AsyncStorage.setItem('user', JSON.stringify(action.payload));
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.access_token;
        state.refreshToken = action.payload.refresh_token;
        state.tokenExpiresAt = action.payload.tokenExpiresAt;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Login failed';
      });

    // Signup
    builder
      .addCase(signup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        console.log('Signup fulfilled, payload:', action.payload);
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.access_token;
        state.refreshToken = action.payload.refresh_token;
        state.tokenExpiresAt = action.payload.tokenExpiresAt;
        console.log('Token set in Redux:', state.token);
      })
      .addCase(signup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Signup failed';
      });

    // Load stored auth
    builder
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.refreshToken = action.payload.refreshToken;
          state.tokenExpiresAt = action.payload.tokenExpiresAt;
          state.isAuthenticated = true;
        }
      });
    
    // Refresh token
    builder
      .addCase(refreshAuthToken.fulfilled, (state, action) => {
        state.token = action.payload.access_token;
        state.refreshToken = action.payload.refresh_token;
        state.tokenExpiresAt = action.payload.tokenExpiresAt;
      })
      .addCase(refreshAuthToken.rejected, (state) => {
        // If refresh fails, log out
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.tokenExpiresAt = null;
        state.isAuthenticated = false;
        AsyncStorage.multiRemove(['token', 'refreshToken', 'tokenExpiresAt', 'user']);
      });
  },
});

export const { logout, clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;