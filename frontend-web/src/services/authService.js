import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_BASE_URL = process.env.REACT_APP_USER_SERVICE_URL || 'http://localhost:8000';

class AuthService {
  constructor() {
    this.setupAxiosInterceptors();
  }

  // Setup axios interceptors for automatic token handling
  setupAxiosInterceptors() {
    // Request interceptor to add token to all requests
    axios.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token && !this.isTokenExpired(token)) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token expiration
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.logout();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Login with username and password
  async login(credentials) {
    try {
      const formData = new FormData();
      formData.append('username', credentials.username);
      formData.append('password', credentials.password);

      const response = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token, token_type } = response.data;
      this.setToken(access_token);
      
      // Get user info from token
      const userInfo = this.getUserFromToken(access_token);
      
      return {
        token: access_token,
        tokenType: token_type,
        user: userInfo,
      };
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  }

  // Register new user
  async register(userData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/auth/register`, userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  }

  // Verify token with backend
  async verifyToken(token = null) {
    try {
      const tokenToVerify = token || this.getToken();
      if (!tokenToVerify) return false;

      const response = await axios.post(`${API_BASE_URL}/api/v1/auth/verify-token`, {}, {
        headers: { Authorization: `Bearer ${tokenToVerify}` }
      });
      
      return response.data.valid;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  }

  // Get current user info
  async getCurrentUser() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/auth/me`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to get user info');
    }
  }

  // Token management
  getToken() {
    return localStorage.getItem('token');
  }

  setToken(token) {
    localStorage.setItem('token', token);
  }

  removeToken() {
    localStorage.removeItem('token');
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getToken();
    return token && !this.isTokenExpired(token);
  }

  // Check if token is expired
  isTokenExpired(token = null) {
    try {
      const tokenToCheck = token || this.getToken();
      if (!tokenToCheck) return true;

      const decoded = jwtDecode(tokenToCheck);
      const currentTime = Date.now() / 1000;
      
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  // Get user info from token
  getUserFromToken(token = null) {
    try {
      const tokenToDeconstruct = token || this.getToken();
      if (!tokenToDeconstruct) return null;

      const decoded = jwtDecode(tokenToDeconstruct);
      return {
        username: decoded.sub,
        role: decoded.role,
        exp: decoded.exp,
        iat: decoded.iat,
      };
    } catch (error) {
      return null;
    }
  }

  // Logout
  logout() {
    this.removeToken();
  }

  // Get auth headers for manual requests
  getAuthHeaders() {
    const token = this.getToken();
    if (token && !this.isTokenExpired(token)) {
      return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
    }
    return {
      'Content-Type': 'application/json',
    };
  }
}

// Create singleton instance
const authService = new AuthService();
export default authService;