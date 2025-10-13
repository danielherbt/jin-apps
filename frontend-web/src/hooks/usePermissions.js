import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook para verificar permisos específicos
 * @param {string} permission - Nombre del permiso a verificar
 * @returns {Object} { hasPermission: boolean, loading: boolean }
 */
export const usePermission = (permission) => {
  const { hasPermission, isAuthenticated } = useAuth();
  const [state, setState] = useState({
    hasPermission: false,
    loading: true,
  });

  useEffect(() => {
    if (!isAuthenticated || !permission) {
      setState({ hasPermission: false, loading: false });
      return;
    }

    let isMounted = true;
    
    const checkPermission = async () => {
      try {
        const result = await hasPermission(permission);
        if (isMounted) {
          setState({ hasPermission: result, loading: false });
        }
      } catch (error) {
        console.error('Permission check failed:', error);
        if (isMounted) {
          setState({ hasPermission: false, loading: false });
        }
      }
    };

    checkPermission();

    return () => {
      isMounted = false;
    };
  }, [permission, hasPermission, isAuthenticated]);

  return state;
};

/**
 * Hook para verificar múltiples permisos
 * @param {Array<string>} permissions - Array de permisos a verificar
 * @param {string} mode - 'all' requiere todos los permisos, 'any' requiere al menos uno
 * @returns {Object} { hasPermission: boolean, loading: boolean }
 */
export const usePermissions = (permissions, mode = 'any') => {
  const { hasPermission, hasAnyPermission, isAuthenticated } = useAuth();
  const [state, setState] = useState({
    hasPermission: false,
    loading: true,
  });

  useEffect(() => {
    if (!isAuthenticated || !permissions || permissions.length === 0) {
      setState({ hasPermission: false, loading: false });
      return;
    }

    let isMounted = true;
    
    const checkPermissions = async () => {
      try {
        let result = false;

        if (mode === 'all') {
          // Verificar que tenga TODOS los permisos
          const checks = await Promise.all(
            permissions.map(perm => hasPermission(perm))
          );
          result = checks.every(check => check === true);
        } else {
          // Verificar que tenga AL MENOS UNO de los permisos
          result = await hasAnyPermission(permissions);
        }

        if (isMounted) {
          setState({ hasPermission: result, loading: false });
        }
      } catch (error) {
        console.error('Multiple permissions check failed:', error);
        if (isMounted) {
          setState({ hasPermission: false, loading: false });
        }
      }
    };

    checkPermissions();

    return () => {
      isMounted = false;
    };
  }, [permissions, mode, hasPermission, hasAnyPermission, isAuthenticated]);

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
  const userManagement = usePermissions(['create_user', 'read_user', 'update_user', 'delete_user'], 'any');
  const systemConfig = usePermission('system_config');
  const viewLogs = usePermission('view_logs');
  const branchManagement = usePermissions(['create_branch', 'update_branch', 'delete_branch'], 'any');
  
  return {
    canManageUsers: userManagement.hasPermission,
    canConfigureSystem: systemConfig.hasPermission,
    canViewLogs: viewLogs.hasPermission,
    canManageBranches: branchManagement.hasPermission,
    loading: userManagement.loading || systemConfig.loading || viewLogs.loading || branchManagement.loading,
  };
};

/**
 * Hook para permisos de POS (Point of Sale)
 * @returns {Object} Conjunto de permisos para operaciones de POS
 */
export const usePOSPermissions = () => {
  const canCreateSale = usePermission('create_sale');
  const canReadSale = usePermission('read_sale');
  const canUpdateSale = usePermission('update_sale');
  const canReadProduct = usePermission('read_product');
  const canCreateInvoice = usePermission('create_invoice');
  
  return {
    canCreateSale: canCreateSale.hasPermission,
    canReadSale: canReadSale.hasPermission,
    canUpdateSale: canUpdateSale.hasPermission,
    canReadProduct: canReadProduct.hasPermission,
    canCreateInvoice: canCreateInvoice.hasPermission,
    loading: canCreateSale.loading || canReadSale.loading || canUpdateSale.loading || 
             canReadProduct.loading || canCreateInvoice.loading,
  };
};

/**
 * Hook para permisos de inventario
 * @returns {Object} Conjunto de permisos para gestión de inventario
 */
export const useInventoryPermissions = () => {
  const canCreateProduct = usePermission('create_product');
  const canReadProduct = usePermission('read_product');
  const canUpdateProduct = usePermission('update_product');
  const canDeleteProduct = usePermission('delete_product');
  
  return {
    canCreateProduct: canCreateProduct.hasPermission,
    canReadProduct: canReadProduct.hasPermission,
    canUpdateProduct: canUpdateProduct.hasPermission,
    canDeleteProduct: canDeleteProduct.hasPermission,
    canManageProducts: canCreateProduct.hasPermission || canUpdateProduct.hasPermission || canDeleteProduct.hasPermission,
    loading: canCreateProduct.loading || canReadProduct.loading || canUpdateProduct.loading || canDeleteProduct.loading,
  };
};

/**
 * Hook para permisos de reportes
 * @returns {Object} Conjunto de permisos para reportes y exportaciones
 */
export const useReportsPermissions = () => {
  const canViewReports = usePermission('view_reports');
  const canExportReports = usePermission('export_reports');
  
  return {
    canViewReports: canViewReports.hasPermission,
    canExportReports: canExportReports.hasPermission,
    loading: canViewReports.loading || canExportReports.loading,
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