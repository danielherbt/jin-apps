import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_BASE_URL = process.env.REACT_APP_USER_SERVICE_URL || 'http://localhost:8000';

class AuthService {
  constructor() {
    this.setupAxiosInterceptors();
    this.userPermissions = [];
    this.availableRoles = [];
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
      const loginData = {
        username: credentials.username,
        password: credentials.password,
      };

      const response = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, loginData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const { access_token, token_type, user } = response.data;
      this.setToken(access_token);
      
      // For simple-login, user info comes directly in response
      return {
        token: access_token,
        tokenType: token_type,
        user: user,
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

      // Handle test tokens (simple-login endpoint)
      if (tokenToVerify.startsWith('test-token-')) {
        return true; // Test tokens are always valid for development
      }

      const response = await axios.get(`${API_BASE_URL}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${tokenToVerify}` }
      });
      
      return response.status === 200;
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

      // Handle test tokens (simple-login endpoint)
      if (tokenToCheck.startsWith('test-token-')) {
        return false; // Test tokens don't expire for development
      }

      const decoded = jwtDecode(tokenToCheck);
      const currentTime = Date.now() / 1000;
      
      return decoded.exp < currentTime;
    } catch (error) {
      // If token can't be decoded, assume it's expired
      return true;
    }
  }

  // Get user info from token
  getUserFromToken(token = null) {
    try {
      const tokenToDeconstruct = token || this.getToken();
      if (!tokenToDeconstruct) return null;

      // Handle test tokens (simple-login endpoint)
      if (tokenToDeconstruct.startsWith('test-token-')) {
        const username = tokenToDeconstruct.replace('test-token-', '');
        // Return basic user info for test tokens
        const testUsers = {
          'admin': { username: 'admin', role: 'admin' },
          'manager': { username: 'manager', role: 'manager' },
          'cashier': { username: 'cashier', role: 'cashier' },
          'viewer': { username: 'viewer', role: 'viewer' }
        };
        return testUsers[username] || { username, role: 'user' };
      }

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

  // === RBAC METHODS ===

  // Check if user has specific permission
  async hasPermission(permission) {
    try {
      // For test tokens, always return true to avoid API errors
      const token = this.getToken();
      if (token && token.startsWith('test-token-')) {
        const user = this.getUserFromToken(token);
        if (user && user.role) {
          const rolePermissions = {
            admin: ['create_user', 'read_user', 'update_user', 'delete_user', 'create_sale', 'read_sale', 'update_sale', 'delete_sale', 'create_product', 'read_product', 'update_product', 'delete_product', 'create_invoice', 'read_invoice', 'update_invoice', 'delete_invoice', 'create_branch', 'read_branch', 'update_branch', 'delete_branch', 'view_reports', 'export_reports', 'system_config', 'view_logs'],
            manager: ['read_user', 'update_user', 'create_sale', 'read_sale', 'update_sale', 'create_product', 'read_product', 'update_product', 'create_invoice', 'read_invoice', 'update_invoice', 'read_branch', 'update_branch', 'view_reports', 'export_reports'],
            cashier: ['create_sale', 'read_sale', 'read_product', 'create_invoice', 'read_invoice', 'read_branch'],
            viewer: ['read_sale', 'read_product', 'read_invoice', 'read_branch']
          };
          const permissions = rolePermissions[user.role] || [];
          return permissions.includes(permission);
        }
      }
      
      const response = await axios.post(`${API_BASE_URL}/api/v1/auth/check-permission`, {
        permission: permission
      });
      return response.data.has_permission;
    } catch (error) {
      console.warn('Permission check failed, using local fallback:', error);
      // Fallback to local permission check
      const token = this.getToken();
      if (token && token.startsWith('test-token-')) {
        const user = this.getUserFromToken(token);
        if (user && user.role) {
          const rolePermissions = {
            admin: ['create_user', 'read_user', 'update_user', 'delete_user', 'create_sale', 'read_sale', 'update_sale', 'delete_sale', 'create_product', 'read_product', 'update_product', 'delete_product', 'create_invoice', 'read_invoice', 'update_invoice', 'delete_invoice', 'create_branch', 'read_branch', 'update_branch', 'delete_branch', 'view_reports', 'export_reports', 'system_config', 'view_logs'],
            manager: ['read_user', 'update_user', 'create_sale', 'read_sale', 'update_sale', 'create_product', 'read_product', 'update_product', 'create_invoice', 'read_invoice', 'update_invoice', 'read_branch', 'update_branch', 'view_reports', 'export_reports'],
            cashier: ['create_sale', 'read_sale', 'read_product', 'create_invoice', 'read_invoice', 'read_branch'],
            viewer: ['read_sale', 'read_product', 'read_invoice', 'read_branch']
          };
          const permissions = rolePermissions[user.role] || [];
          return permissions.includes(permission);
        }
      }
      return false;
    }
  }

  // Check if user has any of the provided permissions
  async hasAnyPermission(permissions) {
    if (!Array.isArray(permissions)) {
      return this.hasPermission(permissions);
    }
    
    try {
      const checks = await Promise.all(
        permissions.map(perm => this.hasPermission(perm))
      );
      return checks.some(result => result === true);
    } catch (error) {
      console.error('Multiple permission check failed:', error);
      return false;
    }
  }

  // Get user permissions
  async getUserPermissions() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/auth/permissions`);
      this.userPermissions = response.data;
      return response.data;
    } catch (error) {
      console.error('Get permissions failed:', error);
      return [];
    }
  }

  // Get effective permissions for a user
  async getEffectivePermissions(userId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/rbac/users/${userId}/effective-permissions`);
      return response.data;
    } catch (error) {
      console.error('Get effective permissions failed:', error);
      throw error;
    }
  }

  // Get available roles
  async getAvailableRoles() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/auth/roles`);
      this.availableRoles = response.data;
      return response.data;
    } catch (error) {
      console.error('Get roles failed:', error);
      return [];
    }
  }

  // Create user (admin only)
  async createUser(userData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/auth/register`, userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'User creation failed');
    }
  }

  // Get all users (admin/manager)
  async getUsers(page = 1, limit = 50) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/auth/users`, {
        params: { skip: (page - 1) * limit, limit }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Get users failed');
    }
  }

  // Update user (admin/manager)
  async updateUser(userId, userData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/v1/auth/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'User update failed');
    }
  }

  // Delete user (admin only)
  async deleteUser(userId) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/v1/auth/users/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'User deletion failed');
    }
  }

  // Check if user has legacy role (for compatibility)
  hasRole(role) {
    const user = this.getUserFromToken();
    if (!user) return false;
    
    // Handle test tokens
    if (typeof user.role === 'string') {
      return user.role === role;
    }
    return false;
  }

  // Check if user has any of the legacy roles (for compatibility)
  hasAnyRole(roles) {
    if (!Array.isArray(roles)) {
      return this.hasRole(roles);
    }
    return roles.some(role => this.hasRole(role));
  }

  // Get cached permissions (for quick checks)
  getCachedPermissions() {
    return this.userPermissions;
  }

  // Setup admin user (first time setup)
  async setupAdmin() {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/auth/setup-admin`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Admin setup failed');
    }
  }
}

// Create singleton instance
const authService = new AuthService();
export default authService;
