import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook para verificar permisos específicos
 * @param {string} permission - Nombre del permiso a verificar
 * @returns {Object} { hasPermission: boolean, loading: boolean }
 */
export const usePermission = (permission) => {
  const { hasPermission, isAuthenticated, user, permissionCache, permissions } = useAuth();
  const [state, setState] = useState({
    hasPermission: false,
    loading: true,
  });

  useEffect(() => {
    if (!isAuthenticated || !permission || !user) {
      setState({ hasPermission: false, loading: false });
      return;
    }

    let isMounted = true;

    const checkPermission = async () => {
      try {
        // Check effective permissions from backend first
        if (permissions && permissions.length > 0) {
          const result = permissions.includes(permission);
          if (isMounted) {
            setState({ hasPermission: result, loading: false });
          }
          return;
        }

        // Check cache first
        if (permissionCache && permissionCache.has(permission)) {
          if (isMounted) {
            setState({ hasPermission: permissionCache.get(permission), loading: false });
          }
          return;
        }

        const result = await hasPermission(permission);
        if (isMounted) {
          setState({ hasPermission: result, loading: false });
        }
      } catch (error) {
        console.warn('Permission check failed, using fallback:', error);
        if (isMounted) {
          // Fallback to local check
          const localResult = checkLocalPermission(user.role, permission);
          setState({ hasPermission: localResult, loading: false });
        }
      }
    };

    checkPermission();

    return () => {
      isMounted = false;
    };
  }, [permission, hasPermission, isAuthenticated, user, permissionCache, permissions]);

  return state;
};

// Local fallback function
const checkLocalPermission = (role, permission) => {
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
  
  const permissions = rolePermissions[role] || [];
  return permissions.includes(permission);
};

/**
 * Hook para verificar múltiples permisos
 * @param {Array<string>} permissions - Array de permisos a verificar
 * @param {string} mode - 'all' requiere todos los permisos, 'any' requiere al menos uno
 * @returns {Object} { hasPermission: boolean, loading: boolean }
 */
export const usePermissions = (permissions, mode = 'any') => {
  const { user, isAuthenticated, permissions: userPermissions } = useAuth();
  const [state, setState] = useState({
    hasPermission: false,
    loading: true,
  });

  useEffect(() => {
    if (!isAuthenticated || !permissions || permissions.length === 0 || !user) {
      setState({ hasPermission: false, loading: false });
      return;
    }

    let isMounted = true;

    const checkPermissions = () => {
      try {
        let result = false;

        // Use effective permissions from backend if available
        if (userPermissions && userPermissions.length > 0) {
          if (mode === 'all') {
            // Verificar que tenga TODOS los permisos
            result = permissions.every(perm => userPermissions.includes(perm));
          } else {
            // Verificar que tenga AL MENOS UNO de los permisos
            result = permissions.some(perm => userPermissions.includes(perm));
          }
        } else {
          // Fallback to local check
          if (mode === 'all') {
            result = permissions.every(perm => checkLocalPermission(user.role, perm));
          } else {
            result = permissions.some(perm => checkLocalPermission(user.role, perm));
          }
        }

        if (isMounted) {
          setState({ hasPermission: result, loading: false });
        }
      } catch (error) {
        console.warn('Multiple permissions check failed:', error);
        if (isMounted) {
          setState({ hasPermission: false, loading: false });
        }
      }
    };

    checkPermissions();

    return () => {
      isMounted = false;
    };
  }, [permissions, mode, user, isAuthenticated, userPermissions]);

  return state;
};

/**
 * Hook para verificación de permisos de recursos específicos
 * @param {string} resource - Nombre del recurso (users, products, sales, etc.)
 * @param {string} action - Acción (create, read, update, delete)
 * @returns {Object} { hasPermission: boolean, loading: boolean }
 */
export const useResourcePermission = (resource, action) => {
  const permission = `${action}_${resource}`;
  return usePermission(permission);
};

/**
 * Hook para verificación de permisos basado en roles (legacy compatibility)
 * @param {string|Array<string>} roles - Rol o array de roles
 * @returns {Object} { hasRole: boolean }
 */
export const useRole = (roles) => {
  const { hasRole, hasAnyRole } = useAuth();
  
  const checkRole = useCallback(() => {
    if (Array.isArray(roles)) {
      return hasAnyRole(roles);
    }
    return hasRole(roles);
  }, [roles, hasRole, hasAnyRole]);

  return {
    hasRole: checkRole()
  };
};

/**
 * Hook para gestión de permisos de administración
 * @returns {Object} Conjunto de permisos administrativos comunes
 */
export const useAdminPermissions = () => {
  const { user, isAuthenticated, permissions } = useAuth();

  if (!isAuthenticated || !user) {
    return {
      canManageUsers: false,
      canConfigureSystem: false,
      canViewLogs: false,
      canManageBranches: false,
      loading: false,
    };
  }

  // Use backend permissions if available
  if (permissions && permissions.length > 0) {
    const canManageUsers = permissions.includes('create_user') || permissions.includes('read_user');
    const canConfigureSystem = permissions.includes('system_config');
    const canViewLogs = permissions.includes('view_logs');
    const canManageBranches = permissions.includes('create_branch') || permissions.includes('update_branch');

    return {
      canManageUsers,
      canConfigureSystem,
      canViewLogs,
      canManageBranches,
      loading: false,
    };
  }

  // Fallback to local check
  const canManageUsers = checkLocalPermission(user.role, 'create_user') || checkLocalPermission(user.role, 'read_user');
  const canConfigureSystem = checkLocalPermission(user.role, 'system_config');
  const canViewLogs = checkLocalPermission(user.role, 'view_logs');
  const canManageBranches = checkLocalPermission(user.role, 'create_branch') || checkLocalPermission(user.role, 'update_branch');

  return {
    canManageUsers,
    canConfigureSystem,
    canViewLogs,
    canManageBranches,
    loading: false,
  };
};

/**
 * Hook para permisos de POS (Point of Sale)
 * @returns {Object} Conjunto de permisos para operaciones de POS
 */
export const usePOSPermissions = () => {
  const { user, isAuthenticated, permissions } = useAuth();

  if (!isAuthenticated || !user) {
    return {
      canCreateSale: false,
      canReadSale: false,
      canUpdateSale: false,
      canReadProduct: false,
      canCreateInvoice: false,
      loading: false,
    };
  }

  // Use backend permissions if available
  if (permissions && permissions.length > 0) {
    return {
      canCreateSale: permissions.includes('create_sale'),
      canReadSale: permissions.includes('read_sale'),
      canUpdateSale: permissions.includes('update_sale'),
      canReadProduct: permissions.includes('read_product'),
      canCreateInvoice: permissions.includes('create_invoice'),
      loading: false,
    };
  }

  // Fallback to local check
  return {
    canCreateSale: checkLocalPermission(user.role, 'create_sale'),
    canReadSale: checkLocalPermission(user.role, 'read_sale'),
    canUpdateSale: checkLocalPermission(user.role, 'update_sale'),
    canReadProduct: checkLocalPermission(user.role, 'read_product'),
    canCreateInvoice: checkLocalPermission(user.role, 'create_invoice'),
    loading: false,
  };
};

/**
 * Hook para permisos de inventario
 * @returns {Object} Conjunto de permisos para gestión de inventario
 */
export const useInventoryPermissions = () => {
  const { user, isAuthenticated, permissions } = useAuth();

  if (!isAuthenticated || !user) {
    return {
      canCreateProduct: false,
      canReadProduct: false,
      canUpdateProduct: false,
      canDeleteProduct: false,
      canManageProducts: false,
      loading: false,
    };
  }

  // Use backend permissions if available
  if (permissions && permissions.length > 0) {
    const canCreate = permissions.includes('create_product');
    const canRead = permissions.includes('read_product');
    const canUpdate = permissions.includes('update_product');
    const canDelete = permissions.includes('delete_product');

    return {
      canCreateProduct: canCreate,
      canReadProduct: canRead,
      canUpdateProduct: canUpdate,
      canDeleteProduct: canDelete,
      canManageProducts: canCreate || canUpdate || canDelete,
      loading: false,
    };
  }

  // Fallback to local check
  const canCreate = checkLocalPermission(user.role, 'create_product');
  const canRead = checkLocalPermission(user.role, 'read_product');
  const canUpdate = checkLocalPermission(user.role, 'update_product');
  const canDelete = checkLocalPermission(user.role, 'delete_product');

  return {
    canCreateProduct: canCreate,
    canReadProduct: canRead,
    canUpdateProduct: canUpdate,
    canDeleteProduct: canDelete,
    canManageProducts: canCreate || canUpdate || canDelete,
    loading: false,
  };
};

/**
 * Hook para permisos de reportes
 * @returns {Object} Conjunto de permisos para reportes y exportaciones
 */
export const useReportsPermissions = () => {
  const { user, isAuthenticated, permissions } = useAuth();

  if (!isAuthenticated || !user) {
    return {
      canViewReports: false,
      canExportReports: false,
      loading: false,
    };
  }

  // Use backend permissions if available
  if (permissions && permissions.length > 0) {
    return {
      canViewReports: permissions.includes('view_reports'),
      canExportReports: permissions.includes('export_reports'),
      loading: false,
    };
  }

  // Fallback to local check
  return {
    canViewReports: checkLocalPermission(user.role, 'view_reports'),
    canExportReports: checkLocalPermission(user.role, 'export_reports'),
    loading: false,
  };
};

// Hook principal que expone todas las utilidades de permisos
export const useRBACUtils = () => {
  const auth = useAuth();

  return {
    // Métodos de verificación
    usePermission,
    usePermissions,
    useResourcePermission,
    useRole,

    // Permisos por módulo
    useAdminPermissions,
    usePOSPermissions,
    useInventoryPermissions,
    useReportsPermissions,

    // Acceso directo al contexto
    ...auth,
  };
};

const permissions = {
  usePermission,
  usePermissions,
  useResourcePermission,
  useRole,
  useAdminPermissions,
  usePOSPermissions,
  useInventoryPermissions,
  useReportsPermissions,
  useRBACUtils,
};

export default permissions;