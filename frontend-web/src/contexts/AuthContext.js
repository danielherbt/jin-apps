import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

// Action types
const AUTH_ACTIONS = {
  INIT_START: 'INIT_START',
  INIT_SUCCESS: 'INIT_SUCCESS',
  INIT_FAILURE: 'INIT_FAILURE',
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_USER: 'SET_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_PERMISSIONS: 'SET_PERMISSIONS',
  SET_ROLES: 'SET_ROLES',
  SET_PERMISSION_CACHE: 'SET_PERMISSION_CACHE',
  PERMISSION_CHECK_START: 'PERMISSION_CHECK_START',
  PERMISSION_CHECK_END: 'PERMISSION_CHECK_END',
};

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  permissions: [],
  roles: [],
  permissionCache: new Map(),
  permissionChecking: false,
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.INIT_START:
      return { ...state, loading: true, error: null };
    case AUTH_ACTIONS.INIT_SUCCESS:
      return { ...state, loading: false, user: action.payload.user, isAuthenticated: action.payload.isAuthenticated };
    case AUTH_ACTIONS.INIT_FAILURE:
      return { ...state, loading: false, user: null, isAuthenticated: false, error: action.payload };
    case AUTH_ACTIONS.LOGIN_START:
      return { ...state, loading: true, error: null };
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return { ...state, loading: false, user: action.payload.user, isAuthenticated: true };
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return { ...state, loading: false, error: action.payload };
    case AUTH_ACTIONS.REGISTER_START:
      return { ...state, loading: true, error: null };
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return { ...state, loading: false };
    case AUTH_ACTIONS.REGISTER_FAILURE:
      return { ...state, loading: false, error: action.payload };
    case AUTH_ACTIONS.LOGOUT:
      return { ...state, user: null, isAuthenticated: false, error: null };
    case AUTH_ACTIONS.SET_USER:
      return { ...state, user: action.payload };
    case AUTH_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    case AUTH_ACTIONS.SET_PERMISSIONS:
      return { ...state, permissions: action.payload };
    case AUTH_ACTIONS.SET_ROLES:
      return { ...state, roles: action.payload };
    case AUTH_ACTIONS.SET_PERMISSION_CACHE:
      const newCache = new Map(state.permissionCache);
      newCache.set(action.payload.key, action.payload.value);
      return { ...state, permissionCache: newCache };
    case AUTH_ACTIONS.PERMISSION_CHECK_START:
      return { ...state, permissionChecking: true };
    case AUTH_ACTIONS.PERMISSION_CHECK_END:
      return { ...state, permissionChecking: false };
    default:
      return state;
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Local permission checking function for test tokens
const checkPermissionLocally = (userRole, permission) => {
  const rolePermissions = {
    admin: [
      // All permissions
      'create_user', 'read_user', 'update_user', 'delete_user',
      'create_sale', 'read_sale', 'update_sale', 'delete_sale',
      'create_product', 'read_product', 'update_product', 'delete_product',
      'create_invoice', 'read_invoice', 'update_invoice', 'delete_invoice',
      'create_branch', 'read_branch', 'update_branch', 'delete_branch',
      'view_reports', 'export_reports', 'system_config', 'view_logs'
    ],
    manager: [
      'read_user', 'update_user', 'create_sale', 'read_sale', 'update_sale',
      'create_product', 'read_product', 'update_product', 'create_invoice',
      'read_invoice', 'update_invoice', 'read_branch', 'update_branch',
      'view_reports', 'export_reports'
    ],
    cashier: [
      'create_sale', 'read_sale', 'read_product', 'create_invoice', 
      'read_invoice', 'read_branch'
    ],
    viewer: [
      'read_sale', 'read_product', 'read_invoice', 'read_branch'
    ]
  };
  
  const permissions = rolePermissions[userRole] || [];
  return permissions.includes(permission);
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const logout = async () => {
    try {
      authService.logout();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Load user permissions from backend
  const loadPermissions = useCallback(async () => {
    if (!state.isAuthenticated || !state.user) return [];

    try {
      // Get effective permissions from backend API
      const effectivePermissions = await authService.getEffectivePermissions(state.user.id);
      const permissions = effectivePermissions.effective_permissions || [];
      dispatch({ type: AUTH_ACTIONS.SET_PERMISSIONS, payload: permissions });
      return permissions;
    } catch (error) {
      console.warn('Failed to load permissions from API, using local fallback:', error);
      // Fallback to local permissions based on role
      if (state.user && state.user.role) {
        const rolePermissions = {
          admin: ['create_user', 'read_user', 'update_user', 'delete_user', 'create_sale', 'read_sale', 'update_sale', 'delete_sale', 'create_product', 'read_product', 'update_product', 'delete_product', 'create_invoice', 'read_invoice', 'update_invoice', 'delete_invoice', 'create_branch', 'read_branch', 'update_branch', 'delete_branch', 'view_reports', 'export_reports', 'system_config', 'view_logs'],
          manager: ['read_user', 'update_user', 'create_sale', 'read_sale', 'update_sale', 'create_product', 'read_product', 'update_product', 'create_invoice', 'read_invoice', 'update_invoice', 'read_branch', 'update_branch', 'view_reports', 'export_reports'],
          cashier: ['create_sale', 'read_sale', 'read_product', 'create_invoice', 'read_invoice', 'read_branch'],
          viewer: ['read_sale', 'read_product', 'read_invoice', 'read_branch']
        };
        const permissions = rolePermissions[state.user.role] || [];
        dispatch({ type: AUTH_ACTIONS.SET_PERMISSIONS, payload: permissions });
        return permissions;
      }
      return [];
    }
  }, [state.isAuthenticated, state.user]);

  // Load available roles from backend
  const loadRoles = useCallback(async () => {
    try {
      // Use local roles first
      const defaultRoles = [
        { role: 'admin', display_name: 'Administrator', description: 'Full system access' },
        { role: 'manager', display_name: 'Manager', description: 'Management operations' },
        { role: 'cashier', display_name: 'Cashier', description: 'Point of sale operations' },
        { role: 'viewer', display_name: 'Viewer', description: 'Read-only access' },
      ];
      
      dispatch({ type: AUTH_ACTIONS.SET_ROLES, payload: defaultRoles });
      return defaultRoles;
    } catch (error) {
      console.warn('Failed to load roles:', error);
      return [];
    }
  }, []);

  // Initialize authentication state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      dispatch({ type: AUTH_ACTIONS.INIT_START });
      try {
        const token = authService.getToken();

        if (token && !authService.isTokenExpired(token)) {
          // Get user info from token
          const userInfo = authService.getUserFromToken(token);
          if (userInfo) {
            // Optionally verify token with backend
            const isValid = await authService.verifyToken(token);
            if (!isValid) {
              throw new Error('Token is invalid');
            }
            dispatch({ type: AUTH_ACTIONS.INIT_SUCCESS, payload: { user: userInfo, isAuthenticated: true } });
          } else {
            dispatch({ type: AUTH_ACTIONS.INIT_SUCCESS, payload: { user: null, isAuthenticated: false } });
          }
        } else {
          dispatch({ type: AUTH_ACTIONS.INIT_SUCCESS, payload: { user: null, isAuthenticated: false } });
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        dispatch({ type: AUTH_ACTIONS.INIT_FAILURE, payload: error.message });
        await logout();
      }
    };

    initializeAuth();
  }, []);

  // Load permissions when user is authenticated
  useEffect(() => {
    if (state.isAuthenticated && state.user) {
      loadPermissions();
      loadRoles();
    }
  }, [state.isAuthenticated, state.user, loadPermissions, loadRoles]);

  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    try {
      const result = await authService.login(credentials);
      
      // Ensure we have user data and delay state update slightly
      if (result && result.user) {
        await new Promise(resolve => setTimeout(resolve, 50));
        dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: { user: result.user } });
      } else {
        throw new Error('Invalid login response');
      }
      
      return result;
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: error.message });
      throw error;
    }
  };

  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });
    try {
      const result = await authService.register(userData);
      dispatch({ type: AUTH_ACTIONS.REGISTER_SUCCESS });
      return result;
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.REGISTER_FAILURE, payload: error.message });
      throw error;
    }
  };


  const getCurrentUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: userData });
      return userData;
    } catch (error) {
      console.error('Get current user failed:', error);
      throw error;
    }
  };

  const refreshUserInfo = async () => {
    try {
      if (state.isAuthenticated) {
        const userData = await getCurrentUser();
        return userData;
      }
    } catch (error) {
      console.error('Refresh user info failed:', error);
      await logout();
    }
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return state.user?.role === role;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return roles.some(role => state.user?.role === role);
  };

  // === RBAC METHODS ===



  // Check if user has specific permission
  const hasPermission = useCallback(async (permission) => {
    if (!state.isAuthenticated) return false;

    // Check cache first
    if (state.permissionCache.has(permission)) {
      return state.permissionCache.get(permission);
    }

    dispatch({ type: AUTH_ACTIONS.PERMISSION_CHECK_START });
    try {
      // Use effective permissions from state if available
      if (state.permissions && state.permissions.length > 0) {
        const result = state.permissions.includes(permission);
        dispatch({
          type: AUTH_ACTIONS.SET_PERMISSION_CACHE,
          payload: { key: permission, value: result }
        });
        return result;
      }

      // Fallback to API call
      const result = await authService.hasPermission(permission);
      dispatch({
        type: AUTH_ACTIONS.SET_PERMISSION_CACHE,
        payload: { key: permission, value: result }
      });
      return result;
    } catch (error) {
      console.warn('Permission check API failed, using local fallback:', error);
      // Fallback to local permission check
      if (state.user && state.user.role) {
        const result = checkPermissionLocally(state.user.role, permission);
        dispatch({
          type: AUTH_ACTIONS.SET_PERMISSION_CACHE,
          payload: { key: permission, value: result }
        });
        return result;
      }
      return false;
    } finally {
      dispatch({ type: AUTH_ACTIONS.PERMISSION_CHECK_END });
    }
  }, [state.isAuthenticated, state.permissionCache, state.user, state.permissions]);

  // Check if user has any of the provided permissions
  const hasAnyPermission = useCallback(async (permissions) => {
    if (!Array.isArray(permissions)) {
      return hasPermission(permissions);
    }
    
    try {
      const results = await Promise.all(
        permissions.map(perm => hasPermission(perm))
      );
      return results.some(result => result === true);
    } catch (error) {
      console.error('Multiple permission check failed:', error);
      return false;
    }
  }, [hasPermission]);

  // Sync check for permissions (uses cached values only)
  const hasPermissionSync = useCallback((permission) => {
    return state.permissionCache.get(permission) || false;
  }, [state.permissionCache]);

  // Clear permission cache
  const clearPermissionCache = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.SET_PERMISSION_CACHE, payload: { key: null, value: null } });
  }, []);

  // Refresh permissions from backend
  const refreshPermissions = useCallback(async () => {
    if (state.isAuthenticated && state.user) {
      try {
        await loadPermissions();
        clearPermissionCache();
      } catch (error) {
        console.error('Failed to refresh permissions:', error);
      }
    }
  }, [state.isAuthenticated, state.user, loadPermissions, clearPermissionCache]);

  // Create user (admin only)
  const createUser = useCallback(async (userData) => {
    try {
      return await authService.createUser(userData);
    } catch (error) {
      console.error('Create user failed:', error);
      throw error;
    }
  }, []);

  // Get all users (admin/manager)
  const getUsers = useCallback(async (page = 1, limit = 50) => {
    try {
      return await authService.getUsers(page, limit);
    } catch (error) {
      console.error('Get users failed:', error);
      throw error;
    }
  }, []);

  // Update user (admin/manager)
  const updateUser = useCallback(async (userId, userData) => {
    try {
      return await authService.updateUser(userId, userData);
    } catch (error) {
      console.error('Update user failed:', error);
      throw error;
    }
  }, []);

  // Delete user (admin only)
  const deleteUser = useCallback(async (userId) => {
    try {
      return await authService.deleteUser(userId);
    } catch (error) {
      console.error('Delete user failed:', error);
      throw error;
    }
  }, []);

  const value = {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,
    permissions: state.permissions,
    roles: state.roles,
    permissionChecking: state.permissionChecking,

    // Authentication Actions
    login,
    register,
    logout,
    getCurrentUser,
    refreshUserInfo,

    // Legacy Role Utilities (for compatibility)
    hasRole,
    hasAnyRole,

    // RBAC Permission Methods
    hasPermission,
    hasAnyPermission,
    hasPermissionSync,
    loadPermissions,
    loadRoles,
    clearPermissionCache,
    refreshPermissions,

    // User Management (RBAC)
    createUser,
    getUsers,
    updateUser,
    deleteUser,

    // Clear error
    clearError: () => dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR }),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;