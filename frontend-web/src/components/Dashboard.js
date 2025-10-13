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
/*import { useAuth } from '../contexts/AuthContext';*/
import { usePOSPermissions, useInventoryPermissions, useReportsPermissions, useAdminPermissions } from '../hooks/usePermissions';
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
  /*const { user } = useAuth();*/
  
  // Get permission hooks
  const posPermissions = usePOSPermissions();
  const inventoryPermissions = useInventoryPermissions();
  const salesPermissions = useReportsPermissions();
  const adminPermissions = useAdminPermissions();

  const menuItems = [
    { 
      text: 'POS', 
      icon: <PointOfSale />, 
      path: '/pos', 
      permissions: ['create_sale', 'read_sale'],
      hasAccess: posPermissions.canCreateSale || posPermissions.canReadSale,
      loading: posPermissions.loading
    },
    { 
      text: 'Inventory', 
      icon: <Inventory />, 
      path: '/inventory', 
      permissions: ['read_product', 'create_product', 'update_product'],
      hasAccess: inventoryPermissions.canReadProduct,
      loading: inventoryPermissions.loading
    },
    { 
      text: 'Sales', 
      icon: <Receipt />, 
      path: '/sales', 
      permissions: ['read_sale', 'view_reports'],
      hasAccess: salesPermissions.canViewReports || posPermissions.canReadSale,
      loading: salesPermissions.loading || posPermissions.loading
    },
    { 
      text: 'Branches', 
      icon: <Business />, 
      path: '/branches', 
      permissions: ['read_branch', 'create_branch', 'update_branch'],
      hasAccess: adminPermissions.canManageBranches,
      loading: adminPermissions.loading
    },
    { 
      text: 'Users', 
      icon: <People />, 
      path: '/users', 
      permissions: ['read_user', 'create_user', 'update_user'],
      hasAccess: adminPermissions.canManageUsers,
      loading: adminPermissions.loading
    },
    { 
      text: 'RBAC Demo', 
      icon: <Security />, 
      path: '/rbac-demo', 
      permissions: [], // Always accessible for demo
      hasAccess: true,
      loading: false
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