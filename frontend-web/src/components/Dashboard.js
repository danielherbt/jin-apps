import React from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Box,
  CssBaseline,
} from '@mui/material';
import {
  PointOfSale,
  Inventory,
  Receipt,
  Business,
  People,
  Security,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import ProtectedRoute from './ProtectedRoute';
import POS from './POS';
import InventoryComponent from './Inventory';
import Sales from './Sales';
import Branches from './Branches';
import UserManagement from './UserManagement';
import RBACDemo from './RBACDemo';

const drawerWidth = 240;

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasRole, hasAnyRole, permissions } = useAuth();

  // Permission check function using backend permissions
  const checkPermission = (permission) => {
    if (!permissions || permissions.length === 0) {
      // Fallback to role-based check if permissions not loaded
      const rolePermissions = {
        admin: ['create_user', 'read_user', 'update_user', 'delete_user', 'create_sale', 'read_sale', 'update_sale', 'delete_sale', 'create_product', 'read_product', 'update_product', 'delete_product', 'create_invoice', 'read_invoice', 'update_invoice', 'delete_invoice', 'create_branch', 'read_branch', 'update_branch', 'delete_branch', 'view_reports', 'export_reports', 'system_config', 'view_logs'],
        manager: ['read_user', 'update_user', 'create_sale', 'read_sale', 'update_sale', 'create_product', 'read_product', 'update_product', 'create_invoice', 'read_invoice', 'update_invoice', 'read_branch', 'update_branch', 'view_reports', 'export_reports'],
        cashier: ['create_sale', 'read_sale', 'read_product', 'create_invoice', 'read_invoice', 'read_branch'],
        viewer: ['read_sale', 'read_product', 'read_invoice', 'read_branch']
      };
      const rolePerms = rolePermissions[user?.role] || [];
      return rolePerms.includes(permission);
    }
    return permissions.includes(permission);
  };

  const menuItems = [
    {
      text: 'POS',
      icon: <PointOfSale />,
      path: '/pos',
      hasAccess: user ? (checkPermission('create_sale') || checkPermission('read_sale')) : false
    },
    {
      text: 'Inventory',
      icon: <Inventory />,
      path: '/inventory',
      hasAccess: user ? checkPermission('read_product') : false
    },
    {
      text: 'Sales',
      icon: <Receipt />,
      path: '/sales',
      hasAccess: user ? (checkPermission('view_reports') || checkPermission('read_sale')) : false
    },
    {
      text: 'Branches',
      icon: <Business />,
      path: '/branches',
      hasAccess: user ? (checkPermission('create_branch') || checkPermission('read_branch')) : false
    },
    {
      text: 'Users',
      icon: <People />,
      path: '/users',
      hasAccess: user ? (checkPermission('create_user') || checkPermission('read_user')) : false
    },
    {
      text: 'RBAC Demo',
      icon: <Security />,
      path: '/rbac-demo',
      hasAccess: true // Always accessible for demo
    },
  ];

  // Filter menu items based on RBAC permissions
  const availableMenuItems = menuItems.filter(item => item.hasAccess);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <CssBaseline />
      
      {/* Header with user info and logout */}
      <Header />
      
      {/* Main content container */}
      <Box sx={{ display: 'flex', mt: '64px' }}>
        {/* Navigation sidebar */}
        <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxSizing: 'border-box',
            position: 'relative',
            height: 'calc(100vh - 64px)',
          },
        }}
      >
        <Box sx={{ overflow: 'auto', pt: 1 }}>
          <List>
            {availableMenuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: location.pathname === item.path ? 'white' : 'inherit',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

        {/* Main content area */}
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            p: 2, 
            minHeight: 'calc(100vh - 64px)',
            backgroundColor: '#f5f5f5',
            overflow: 'auto',
          }}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/pos" replace />} />
          <Route
            path="/pos"
            element={
              <ProtectedRoute 
                permissions={['create_sale', 'read_sale']}
                requireAll={false}
              >
                <POS />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute 
                permissions={['read_product']}
                requireAll={false}
              >
                <InventoryComponent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales"
            element={
              <ProtectedRoute 
                permissions={['read_sale', 'view_reports']}
                requireAll={false}
              >
                <Sales />
              </ProtectedRoute>
            }
          />
          <Route
            path="/branches"
            element={
              <ProtectedRoute 
                permissions={['read_branch']}
                requireAll={false}
              >
                <Branches />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute 
                permissions={['read_user']}
                requireAll={false}
              >
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rbac-demo"
            element={<RBACDemo />}
          />
        </Routes>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;