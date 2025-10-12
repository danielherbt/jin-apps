import React, { createContext, useContext, useEffect, useReducer } from 'react';
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
};

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
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

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

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

  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    try {
      const result = await authService.login(credentials);
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: { user: result.user } });
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

  const logout = async () => {
    try {
      authService.logout();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    } catch (error) {
      console.error('Logout error:', error);
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

  const value = {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,

    // Actions
    login,
    register,
    logout,
    getCurrentUser,
    refreshUserInfo,

    // Utilities
    hasRole,
    hasAnyRole,

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