import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions, useRole } from '../hooks/usePermissions';

const ProtectedRoute = ({ 
  children, 
  roles = [],           // Legacy role-based access (for compatibility)
  permissions = [],     // RBAC permission-based access
  requireAll = false,   // If true, requires ALL permissions; if false, requires ANY
  fallbackPath = '/login'
}) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();
  
  // Legacy role check (for backward compatibility)
  const roleCheck = useRole(roles);
  
  // RBAC permission check
  const permissionCheck = usePermissions(permissions, requireAll ? 'all' : 'any');

  // Show loading spinner while checking authentication or permissions
  if (loading || permissionCheck.loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress size={50} />
        <Typography variant="body1">
          {loading ? 'Checking authentication...' : 'Verifying permissions...'}
        </Typography>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Determine access based on permissions or roles
  let hasAccess = true;
  let accessError = null;

  // Check permissions first (RBAC takes precedence)
  if (permissions.length > 0) {
    hasAccess = permissionCheck.hasPermission;
    if (!hasAccess) {
      accessError = {
        type: 'permission',
        required: permissions,
        mode: requireAll ? 'all' : 'any'
      };
    }
  }
  // Fallback to role-based check (legacy compatibility)
  else if (roles.length > 0) {
    hasAccess = roleCheck.hasRole;
    if (!hasAccess) {
      accessError = {
        type: 'role',
        required: roles,
        current: user?.role
      };
    }
  }

  // Show access denied message
  if (!hasAccess && accessError) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="50vh"
        gap={3}
        p={4}
      >
        <Alert severity="error" sx={{ maxWidth: 600 }}>
          <Typography variant="h6" gutterBottom>
            🔒 Access Denied
          </Typography>
          <Typography variant="body1" gutterBottom>
            You don't have the required {accessError.type === 'permission' ? 'permissions' : 'role'} to access this page.
          </Typography>
          
          {accessError.type === 'permission' ? (
            <>
              <Typography variant="body2" color="textSecondary">
                Required permissions ({accessError.mode === 'all' ? 'ALL required' : 'ANY required'}):
              </Typography>
              <Typography variant="body2" component="ul" sx={{ pl: 2, mt: 1 }}>
                {accessError.required.map(perm => (
                  <li key={perm}>{perm}</li>
                ))}
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="body2" color="textSecondary">
                Required roles: {accessError.required.join(', ')}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Your role: {accessError.current || 'Unknown'}
              </Typography>
            </>
          )}
        </Alert>
        
        <Typography variant="body2" color="textSecondary">
          Contact your administrator if you believe this is an error.
        </Typography>
      </Box>
    );
  }

  // Render protected content
  return children;
};

export default ProtectedRoute;