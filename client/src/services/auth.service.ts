import { API_URL } from '@/config/api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface ApiError {
  error: string;
  message: string;
  details?: any;
  conflictField?: string;
}

class AuthService {
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw result as ApiError;
    }

    // Store tokens in localStorage
    localStorage.setItem('accessToken', result.tokens.accessToken);
    localStorage.setItem('refreshToken', result.tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(result.user));

    return result;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    console.log('🚀 Frontend: Starting registration request');
    console.log('📡 URL:', `${API_URL}/auth/register`);
    console.log('📦 Data:', data);
    
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('📊 Response status:', response.status);
      console.log('📊 Response ok:', response.ok);

      const result = await response.json();
      console.log('📋 Response data:', result);

      if (!response.ok) {
        console.error('❌ Registration failed:', result);
        throw result as ApiError;
      }

      console.log('✅ Registration successful!');
      // Store tokens in localStorage
      localStorage.setItem('accessToken', result.tokens.accessToken);
      localStorage.setItem('refreshToken', result.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(result.user));

      return result;
    } catch (error) {
      console.error('🚨 Network error during registration:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear stored data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  getUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  async refreshToken(): Promise<string> {
    // If already refreshing, return the existing promise
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    this.isRefreshing = true;
    this.refreshPromise = this._performTokenRefresh(refreshToken);

    try {
      const newAccessToken = await this.refreshPromise;
      return newAccessToken;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async _performTokenRefresh(refreshToken: string): Promise<string> {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      // Refresh token is invalid, force logout
      this.logout();
      throw new Error('Token refresh failed');
    }

    const result = await response.json();
    
    // Store new tokens
    localStorage.setItem('accessToken', result.tokens.accessToken);
    localStorage.setItem('refreshToken', result.tokens.refreshToken);
    
    return result.tokens.accessToken;
  }

  isTokenExpired(token?: string): boolean {
    const accessToken = token || this.getToken();
    if (!accessToken) return true;

    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      // Check if token expires in the next 5 minutes (300 seconds)
      return payload.exp < (currentTime + 300);
    } catch {
      return true;
    }
  }

  async getValidToken(): Promise<string> {
    const currentToken = this.getToken();
    
    if (!currentToken) {
      throw new Error('No access token available');
    }

    // If token is about to expire, refresh it
    if (this.isTokenExpired(currentToken)) {
      console.log('🔄 Token expiring soon, refreshing...');
      return await this.refreshToken();
    }

    return currentToken;
  }
}

export const authService = new AuthService();
