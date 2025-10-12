import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
} from '@mui/material';
import {
  Business,
  Add,
  Edit,
  Delete,
  LocationOn,
  Phone,
  Email,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Branches = () => {
  const { user, hasRole } = useAuth();
  const [open, setOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    manager: '',
    status: 'active'
  });
  
  // Sample branches data - replace with API call
  const [branches, setBranches] = useState([
    {
      id: 1,
      name: 'Main Store',
      address: '123 Main Street, Downtown',
      phone: '+1 (555) 123-4567',
      email: 'main@possystem.com',
      manager: 'John Manager',
      status: 'active',
      sales_today: 2549.99,
      employees: 8
    },
    {
      id: 2,
      name: 'Shopping Mall Branch',
      address: '456 Mall Avenue, Suite 201',
      phone: '+1 (555) 234-5678',
      email: 'mall@possystem.com',
      manager: 'Sarah Wilson',
      status: 'active',
      sales_today: 1849.97,
      employees: 5
    },
    {
      id: 3,
      name: 'Airport Terminal',
      address: 'Terminal B, Gate 15, Airport',
      phone: '+1 (555) 345-6789',
      email: 'airport@possystem.com',
      manager: 'Mike Davis',
      status: 'maintenance',
      sales_today: 0,
      employees: 3
    }
  ]);
  
  // Check if user has admin role for branch management
  const canManageBranches = hasRole('admin');
  
  const handleOpen = (branch = null) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData({
        name: branch.name || '',
        address: branch.address || '',
        phone: branch.phone || '',
        email: branch.email || '',
        manager: branch.manager || '',
        status: branch.status || 'active'
      });
    } else {
      setEditingBranch(null);
      setFormData({
        name: '',
        address: '',
        phone: '',
        email: '',
        manager: '',
        status: 'active'
      });
    }
    setOpen(true);
  };
  
  const handleClose = () => {
    setOpen(false);
    setEditingBranch(null);
    setError('');
  };
  
  const handleSubmit = () => {
    if (!canManageBranches) {
      setError('Permission denied. Only admins can manage branches.');
      return;
    }
    
    try {
      if (editingBranch) {
        // Update existing branch
        const updatedBranches = branches.map(b => 
          b.id === editingBranch.id ? { ...b, ...formData } : b
        );
        setBranches(updatedBranches);
        setSuccessMessage('Branch updated successfully!');
      } else {
        // Create new branch
        const newBranch = {
          id: Math.max(...branches.map(b => b.id)) + 1,
          ...formData,
          sales_today: 0,
          employees: 0
        };
        setBranches([...branches, newBranch]);
        setSuccessMessage('Branch created successfully!');
      }
      
      handleClose();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Operation failed');
    }
  };
  
  const handleDelete = (id) => {
    if (!canManageBranches) {
      setError('Permission denied. Only admins can delete branches.');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this branch?')) {
      try {
        const filteredBranches = branches.filter(b => b.id !== id);
        setBranches(filteredBranches);
        setSuccessMessage('Branch deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        setError('Delete operation failed');
      }
    }
  };
  
  const totalSales = branches.reduce((sum, branch) => sum + branch.sales_today, 0);
  const activeBranches = branches.filter(b => b.status === 'active').length;
  const totalEmployees = branches.reduce((sum, branch) => sum + branch.employees, 0);
  
  return (
    <Container>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Business sx={{ mr: 2, fontSize: 40, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Branch Management
        </Typography>
        {canManageBranches && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => handleOpen()}
          >
            Add Branch
          </Button>
        )}
      </Box>
      
      {user && (
        <Typography variant="subtitle1" sx={{ mb: 2, color: 'text.secondary' }}>
          👤 User: {user.username} | Role: {user.role}
          {!canManageBranches && ' (Read Only)'}
        </Typography>
      )}
      
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {branches.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Branches
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {activeBranches}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Branches
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {totalEmployees}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Employees
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                ${totalSales.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Today's Sales
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Branches Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Branch Name</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Manager</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Today's Sales</TableCell>
              <TableCell>Status</TableCell>
              {canManageBranches && <TableCell>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {branches.map((branch) => (
              <TableRow key={branch.id}>
                <TableCell>
                  <Typography variant="subtitle2">
                    {branch.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {branch.employees} employees
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocationOn sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                    {branch.address}
                  </Box>
                </TableCell>
                <TableCell>{branch.manager}</TableCell>
                <TableCell>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Phone sx={{ mr: 1, fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="body2">{branch.phone}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Email sx={{ mr: 1, fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="body2">{branch.email}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>${branch.sales_today.toFixed(2)}</TableCell>
                <TableCell>
                  <Chip
                    label={branch.status.charAt(0).toUpperCase() + branch.status.slice(1)}
                    color={
                      branch.status === 'active' ? 'success' :
                      branch.status === 'maintenance' ? 'warning' : 'error'
                    }
                    size="small"
                  />
                </TableCell>
                {canManageBranches && (
                  <TableCell>
                    <IconButton
                      onClick={() => handleOpen(branch)}
                      color="primary"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(branch.id)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingBranch ? 'Edit Branch' : 'Add Branch'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Branch Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Address"
              multiline
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
            <Box display="flex" gap={2}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
            </Box>
            <Box display="flex" gap={2}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Manager"
                value={formData.manager}
                onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
              />
              <TextField
                margin="normal"
                select
                fullWidth
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </TextField>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingBranch ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Branches;