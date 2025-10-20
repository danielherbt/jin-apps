import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({
  children,
  roles = [],           // Legacy role-based access (for compatibility)
  permissions = [],     // RBAC permission-based access
  requireAll = false,   // If true, requires ALL permissions; if false, requires ANY
  fallbackPath = '/login'
}) => {
  const { isAuthenticated, loading, user, hasPermission } = useAuth();
  const location = useLocation();

  // Local permission check function for fallback
  const checkLocalPermission = (userRole, permission) => {
    const rolePermissions = {
      admin: [
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

    const perms = rolePermissions[userRole] || [];
    return perms.includes(permission);
  };

  // Show loading spinner while checking authentication
  if (loading) {
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
          Checking authentication...
        </Typography>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check access based on permissions or roles
  let hasAccess = true;
  let accessError = null;

  // Check permissions first (RBAC takes precedence)
  if (permissions.length > 0) {
    // Use async permission checking
    const checkPermissions = async () => {
      if (requireAll) {
        // User must have ALL permissions
        const results = await Promise.all(permissions.map(perm => hasPermission(perm)));
        return results.every(result => result === true);
      } else {
        // User must have at least ONE permission
        const results = await Promise.all(permissions.map(perm => hasPermission(perm)));
        return results.some(result => result === true);
      }
    };

    // For now, use synchronous check with local fallback
    if (requireAll) {
      hasAccess = permissions.every(perm => checkLocalPermission(user.role, perm));
    } else {
      hasAccess = permissions.some(perm => checkLocalPermission(user.role, perm));
    }

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
    hasAccess = roles.includes(user.role);
    if (!hasAccess) {
      accessError = {
        type: 'role',
        required: roles,
        current: user.role
      };
    }
  }
  // If no permissions or roles specified, allow access (for components like Dashboard)
  else {
    hasAccess = true;
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
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Your role: {user.role}
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