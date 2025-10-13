import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Security,
  CheckCircle,
  Cancel,
  Person,
  Group,
  VpnKey,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { 
  usePermission, 
  usePermissions, 
  useAdminPermissions,
  usePOSPermissions,
  useInventoryPermissions,
  useReportsPermissions 
} from '../hooks/usePermissions';

const RBACDemo = () => {
  const { user, isAuthenticated } = useAuth();
  const [selectedPermission, setSelectedPermission] = useState('create_user');
  
  // Get permission hooks for demo
  const singlePermission = usePermission(selectedPermission);
  const multiplePermissions = usePermissions(['create_user', 'delete_user'], 'any');
  const adminPermissions = useAdminPermissions();
  const posPermissions = usePOSPermissions();
  const inventoryPermissions = useInventoryPermissions();
  const reportsPermissions = useReportsPermissions();

  // Available permissions for testing
  const availablePermissions = [
    'create_user', 'read_user', 'update_user', 'delete_user',
    'create_sale', 'read_sale', 'update_sale', 'delete_sale',
    'create_product', 'read_product', 'update_product', 'delete_product',
    'create_invoice', 'read_invoice', 'update_invoice', 'delete_invoice',
    'create_branch', 'read_branch', 'update_branch', 'delete_branch',
    'view_reports', 'export_reports', 'system_config', 'view_logs'
  ];

  // Demo roles with their typical permissions
  const demoRoles = [
    {
      name: 'admin',
      displayName: 'Administrator',
      permissions: availablePermissions, // All permissions
      color: 'error',
      description: 'Full system access'
    },
    {
      name: 'manager',
      displayName: 'Manager',
      permissions: [
        'read_user', 'update_user', 'create_sale', 'read_sale', 'update_sale',
        'create_product', 'read_product', 'update_product', 'create_invoice',
        'read_invoice', 'update_invoice', 'read_branch', 'update_branch',
        'view_reports', 'export_reports'
      ],
      color: 'warning',
      description: 'Management level operations'
    },
    {
      name: 'cashier',
      displayName: 'Cashier',
      permissions: [
        'create_sale', 'read_sale', 'read_product', 'create_invoice', 
        'read_invoice', 'read_branch'
      ],
      color: 'info',
      description: 'Point of sale operations'
    },
    {
      name: 'viewer',
      displayName: 'Viewer',
      permissions: ['read_sale', 'read_product', 'read_invoice', 'read_branch'],
      color: 'default',
      description: 'Read-only access'
    }
  ];

  const currentRole = demoRoles.find(role => role.name === user?.role) || demoRoles[3]; // Default to viewer

  const PermissionStatus = ({ hasPermission, loading, label }) => (
    <Box display="flex" alignItems="center" gap={1}>
      {loading ? (
        <Typography variant="body2">Checking...</Typography>
      ) : (
        <>
          {hasPermission ? (
            <CheckCircle color="success" fontSize="small" />
          ) : (
            <Cancel color="error" fontSize="small" />
          )}
          <Typography 
            variant="body2" 
            color={hasPermission ? 'success.main' : 'error.main'}
          >
            {label}: {hasPermission ? 'Granted' : 'Denied'}
          </Typography>
        </>
      )}
    </Box>
  );

  return (
    <Container sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Security sx={{ mr: 2, fontSize: 40, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          RBAC System Demo
        </Typography>
      </Box>

      {!isAuthenticated && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Please login to see RBAC functionality in action.
        </Alert>
      )}

      {/* Current User Info */}
      {user && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Person color="primary" />
              <Typography variant="h6">Current User Information</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography><strong>Username:</strong> {user.username}</Typography>
                <Typography><strong>Role:</strong> 
                  <Chip 
                    size="small" 
                    label={currentRole.displayName} 
                    color={currentRole.color} 
                    sx={{ ml: 1 }}
                  />
                </Typography>
                <Typography><strong>Description:</strong> {currentRole.description}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</Typography>
                <Typography><strong>Permissions Count:</strong> {currentRole.permissions.length}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Permission Testing */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <VpnKey color="primary" />
            <Typography variant="h6">Permission Testing</Typography>
          </Box>
          
          <FormControl sx={{ mb: 2, minWidth: 200 }}>
            <InputLabel>Select Permission</InputLabel>
            <Select
              value={selectedPermission}
              onChange={(e) => setSelectedPermission(e.target.value)}
              label="Select Permission"
            >
              {availablePermissions.map(perm => (
                <MenuItem key={perm} value={perm}>
                  {perm.replace('_', ' ').toUpperCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ mt: 2 }}>
            <PermissionStatus 
              hasPermission={singlePermission.hasPermission}
              loading={singlePermission.loading}
              label={`Single Permission (${selectedPermission})`}
            />
            <PermissionStatus 
              hasPermission={multiplePermissions.hasPermission}
              loading={multiplePermissions.loading}
              label="Multiple Permissions (create_user OR delete_user)"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Module Permissions Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Group color="primary" />
            <Typography variant="h6">Module Permissions Summary</Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Administrative</strong>
              </Typography>
              <PermissionStatus 
                hasPermission={adminPermissions.canManageUsers}
                loading={adminPermissions.loading}
                label="Manage Users"
              />
              <PermissionStatus 
                hasPermission={adminPermissions.canConfigureSystem}
                loading={adminPermissions.loading}
                label="System Configuration"
              />
              <PermissionStatus 
                hasPermission={adminPermissions.canViewLogs}
                loading={adminPermissions.loading}
                label="View Logs"
              />
              <PermissionStatus 
                hasPermission={adminPermissions.canManageBranches}
                loading={adminPermissions.loading}
                label="Manage Branches"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Point of Sale</strong>
              </Typography>
              <PermissionStatus 
                hasPermission={posPermissions.canCreateSale}
                loading={posPermissions.loading}
                label="Create Sales"
              />
              <PermissionStatus 
                hasPermission={posPermissions.canReadSale}
                loading={posPermissions.loading}
                label="View Sales"
              />
              <PermissionStatus 
                hasPermission={posPermissions.canUpdateSale}
                loading={posPermissions.loading}
                label="Modify Sales"
              />
              <PermissionStatus 
                hasPermission={posPermissions.canCreateInvoice}
                loading={posPermissions.loading}
                label="Create Invoices"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Inventory Management</strong>
              </Typography>
              <PermissionStatus 
                hasPermission={inventoryPermissions.canCreateProduct}
                loading={inventoryPermissions.loading}
                label="Create Products"
              />
              <PermissionStatus 
                hasPermission={inventoryPermissions.canReadProduct}
                loading={inventoryPermissions.loading}
                label="View Products"
              />
              <PermissionStatus 
                hasPermission={inventoryPermissions.canUpdateProduct}
                loading={inventoryPermissions.loading}
                label="Update Products"
              />
              <PermissionStatus 
                hasPermission={inventoryPermissions.canDeleteProduct}
                loading={inventoryPermissions.loading}
                label="Delete Products"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Reports & Analytics</strong>
              </Typography>
              <PermissionStatus 
                hasPermission={reportsPermissions.canViewReports}
                loading={reportsPermissions.loading}
                label="View Reports"
              />
              <PermissionStatus 
                hasPermission={reportsPermissions.canExportReports}
                loading={reportsPermissions.loading}
                label="Export Reports"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Role Permission Matrix */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Role Permission Matrix
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            This shows what permissions each role has access to:
          </Typography>
          
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Permission</strong></TableCell>
                  {demoRoles.map(role => (
                    <TableCell key={role.name} align="center">
                      <Chip 
                        size="small" 
                        label={role.displayName} 
                        color={role.color}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {availablePermissions.slice(0, 12).map(permission => ( // Show first 12 for demo
                  <TableRow key={permission}>
                    <TableCell>
                      <Typography variant="body2">
                        {permission.replace('_', ' ').toLowerCase()}
                      </Typography>
                    </TableCell>
                    {demoRoles.map(role => (
                      <TableCell key={role.name} align="center">
                        {role.permissions.includes(permission) ? (
                          <CheckCircle color="success" fontSize="small" />
                        ) : (
                          <Cancel color="error" fontSize="small" />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* RBAC Features Info */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🎯 RBAC System Features
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                ✅ Implemented Features:
              </Typography>
              <ul>
                <li>Role-based access control</li>
                <li>Granular permission system</li>
                <li>Dynamic menu filtering</li>
                <li>Component-level protection</li>
                <li>Permission caching</li>
                <li>Async permission checking</li>
                <li>Multiple permission modes (ANY/ALL)</li>
                <li>Resource-based permissions</li>
                <li>Custom hooks for permissions</li>
                <li>Legacy role compatibility</li>
              </ul>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                🔧 Available Roles:
              </Typography>
              {demoRoles.map(role => (
                <Box key={role.name} sx={{ mb: 1 }}>
                  <Chip 
                    size="small" 
                    label={role.displayName} 
                    color={role.color}
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="body2" component="span">
                    {role.description}
                  </Typography>
                </Box>
              ))}
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
};

export default RBACDemo;