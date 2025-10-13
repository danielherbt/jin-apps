import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Chip,
  Alert,
  Fab,
  Tooltip,
  CircularProgress,
  Avatar,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  PersonAdd,
  SupervisorAccount,
  Visibility,
  VisibilityOff,
  People,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useAdminPermissions } from '../hooks/usePermissions';

const UserManagement = () => {
  const { user: currentUser, createUser, getUsers, updateUser, deleteUser, roles } = useAuth();
  const adminPermissions = useAdminPermissions();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    role: 'viewer',
    is_active: true,
    branch_id: null,
  });

  // Default roles if not loaded from backend
  const defaultRoles = [
    { role: 'admin', display_name: 'Administrator', description: 'Full system access' },
    { role: 'manager', display_name: 'Manager', description: 'Management operations' },
    { role: 'cashier', display_name: 'Cashier', description: 'Point of sale operations' },
    { role: 'viewer', display_name: 'Viewer', description: 'Read-only access' },
  ];

  const availableRoles = roles.length > 0 ? roles : defaultRoles;

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    if (!adminPermissions.canManageUsers) {
      setError('You do not have permission to view users.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await getUsers();
      setUsers(Array.isArray(response) ? response : []);
    } catch (err) {
      setError('Failed to load users: ' + (err.message || 'Unknown error'));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (userToEdit = null) => {
    if (userToEdit) {
      setEditingUser(userToEdit);
      setFormData({
        username: userToEdit.username || '',
        email: userToEdit.email || '',
        full_name: userToEdit.full_name || '',
        password: '', // Don't prefill password
        role: userToEdit.role || 'viewer',
        is_active: userToEdit.is_active !== false,
        branch_id: userToEdit.branch_id || null,
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        full_name: '',
        password: '',
        role: 'viewer',
        is_active: true,
        branch_id: null,
      });
    }
    setError('');
    setSuccess('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
    setShowPassword(false);
  };

  const handleSubmit = async () => {
    if (!adminPermissions.canManageUsers) {
      setError('You do not have permission to manage users.');
      return;
    }

    // Basic validation
    if (!formData.username || !formData.email || !formData.full_name) {
      setError('Username, email, and full name are required.');
      return;
    }

    if (!editingUser && !formData.password) {
      setError('Password is required for new users.');
      return;
    }

    try {
      setLoading(true);
      
      const userData = {
        username: formData.username,
        email: formData.email,
        full_name: formData.full_name,
        role: formData.role,
        is_active: formData.is_active,
        branch_id: formData.branch_id || null,
      };

      if (formData.password) {
        userData.password = formData.password;
      }

      if (editingUser) {
        await updateUser(editingUser.id, userData);
        setSuccess('User updated successfully!');
      } else {
        await createUser(userData);
        setSuccess('User created successfully!');
      }
      
      await loadUsers();
      handleCloseDialog();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Operation failed: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId, username) => {
    if (!adminPermissions.canManageUsers) {
      setError('You do not have permission to delete users.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      await deleteUser(userId);
      setSuccess('User deleted successfully!');
      await loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Delete failed: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'error',
      manager: 'warning', 
      cashier: 'info',
      viewer: 'default'
    };
    return colors[role] || 'default';
  };

  const getRoleDisplay = (role) => {
    const roleObj = availableRoles.find(r => (r.role || r.name) === role);
    return roleObj ? (roleObj.display_name || roleObj.name || role) : role;
  };

  if (!adminPermissions.canManageUsers) {
    return (
      <Container sx={{ mt: 2 }}>
        <Alert severity="error">
          <Typography variant="h6">Access Denied</Typography>
          <Typography>You do not have permission to access user management.</Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <People sx={{ mr: 2, fontSize: 40, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => handleOpenDialog()}
          disabled={loading}
        >
          Add User
        </Button>
      </Box>

      {currentUser && (
        <Typography variant="subtitle1" sx={{ mb: 2, color: 'text.secondary' }}>
          👤 Current User: {currentUser.username} | Role: {currentUser.role}
        </Typography>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Users Statistics */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Users Overview
          </Typography>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Box>
              <Typography variant="h4" color="primary">
                {users.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Users
              </Typography>
            </Box>
            <Box>
              <Typography variant="h4" color="success.main">
                {users.filter(u => u.is_active !== false).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Users
              </Typography>
            </Box>
            <Box>
              <Typography variant="h4" color="warning.main">
                {users.filter(u => u.role === 'admin').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Administrators
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Branch</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary">
                    No users found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {user.username?.charAt(0)?.toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">
                          {user.username}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {user.full_name}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={getRoleDisplay(user.role)}
                      color={getRoleColor(user.role)}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={user.is_active !== false ? 'Active' : 'Inactive'}
                      color={user.is_active !== false ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    {user.branch_id ? `Branch ${user.branch_id}` : 'All Branches'}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit User">
                      <IconButton
                        onClick={() => handleOpenDialog(user)}
                        color="primary"
                        size="small"
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete User">
                      <IconButton
                        onClick={() => handleDelete(user.id, user.username)}
                        color="error"
                        size="small"
                        disabled={user.id === currentUser?.id} // Can't delete self
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit User Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingUser ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              disabled={editingUser !== null} // Can't change username when editing
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Full Name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <TextField
              margin="normal"
              fullWidth
              label={editingUser ? "New Password (leave blank to keep current)" : "Password"}
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingUser}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
              }}
            />
            <TextField
              margin="normal"
              select
              fullWidth
              label="Role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              {availableRoles.map((role) => (
                <MenuItem key={role.role || role.name} value={role.role || role.name}>
                  {role.display_name || role.name} - {role.description}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              margin="normal"
              select
              fullWidth
              label="Status"
              value={formData.is_active ? 'active' : 'inactive'}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
            <TextField
              margin="normal"
              fullWidth
              label="Branch ID (Optional)"
              type="number"
              value={formData.branch_id || ''}
              onChange={(e) => setFormData({ ...formData, branch_id: e.target.value ? parseInt(e.target.value) : null })}
              helperText="Leave empty for access to all branches"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {editingUser ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManagement;