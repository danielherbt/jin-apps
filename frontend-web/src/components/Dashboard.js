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
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import ProtectedRoute from './ProtectedRoute';
import POS from './POS';
import InventoryComponent from './Inventory';
import Sales from './Sales';
import Branches from './Branches';

const drawerWidth = 240;

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasAnyRole } = useAuth();

  const menuItems = [
    { text: 'POS', icon: <PointOfSale />, path: '/pos', roles: ['user', 'manager', 'admin'] },
    { text: 'Inventory', icon: <Inventory />, path: '/inventory', roles: ['manager', 'admin'] },
    { text: 'Sales', icon: <Receipt />, path: '/sales', roles: ['user', 'manager', 'admin'] },
    { text: 'Branches', icon: <Business />, path: '/branches', roles: ['admin'] },
  ];

  // Filter menu items based on user role
  const availableMenuItems = menuItems.filter(item => 
    !item.roles || hasAnyRole(item.roles)
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* Header with user info and logout */}
      <Header />

      {/* Navigation sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxSizing: 'border-box',
            top: 64, // Account for AppBar height
            height: 'calc(100% - 64px)',
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
          p: 3, 
          ml: `${drawerWidth}px`,
          mt: '64px', // Account for AppBar height
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/pos" replace />} />
          <Route
            path="/pos"
            element={
              <ProtectedRoute roles={['user', 'manager', 'admin']}>
                <POS />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute roles={['manager', 'admin']}>
                <InventoryComponent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales"
            element={
              <ProtectedRoute roles={['user', 'manager', 'admin']}>
                <Sales />
              </ProtectedRoute>
            }
          />
          <Route
            path="/branches"
            element={
              <ProtectedRoute roles={['admin']}>
                <Branches />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Box>
    </Box>
  );
};

export default Dashboard;