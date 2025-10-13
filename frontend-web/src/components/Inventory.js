import React, { useState } from "react";
import {
  Container,
  Typography,
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
  Box,
  Alert,
  IconButton,
  Chip,
} from "@mui/material";
import { Add, Edit, Delete, Inventory2 } from "@mui/icons-material";
import { useAuth } from '../contexts/AuthContext';
import { useInventoryPermissions } from '../hooks/usePermissions';

const Inventory = () => {
  const { user } = useAuth();
  const permissions = useInventoryPermissions();
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Sample products - replace with API call
  const [products, setProducts] = useState([
    {
      id: 1,
      name: 'Laptop Dell XPS 13',
      sku: 'DELL-XPS13-001',
      category: 'Electronics',
      price: 1299.99,
      stock_quantity: 5,
      min_stock: 2,
      cost: 1000.00
    },
    {
      id: 2,
      name: 'Mouse Logitech MX Master',
      sku: 'LOG-MX-002',
      category: 'Accessories',
      price: 99.99,
      stock_quantity: 15,
      min_stock: 5,
      cost: 70.00
    },
    {
      id: 3,
      name: 'Keyboard Mechanical RGB',
      sku: 'KEY-RGB-003',
      category: 'Accessories',
      price: 149.99,
      stock_quantity: 8,
      min_stock: 3,
      cost: 100.00
    },
    {
      id: 4,
      name: 'Monitor 27 4K',
      sku: 'MON-27-4K-004',
      category: 'Electronics',
      price: 399.99,
      stock_quantity: 3,
      min_stock: 2,
      cost: 300.00
    }
  ]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    cost: "",
    sku: "",
    barcode: "",
    category: "",
    stock_quantity: "",
    min_stock: "",
    branch_id: 1, // Default branch
  });

  const handleOpen = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || "",
        description: product.description || "",
        price: product.price || "",
        cost: product.cost || "",
        sku: product.sku || "",
        barcode: product.barcode || "",
        category: product.category || "",
        stock_quantity: product.stock_quantity || "",
        min_stock: product.min_stock || "",
        branch_id: product.branch_id || 1,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        cost: "",
        sku: "",
        barcode: "",
        category: "",
        stock_quantity: "",
        min_stock: "",
        branch_id: 1,
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = async () => {
    const canCreate = editingProduct ? permissions.canUpdateProduct : permissions.canCreateProduct;
    if (!canCreate) {
      setError(`Permission denied. You don't have permission to ${editingProduct ? 'update' : 'create'} products.`);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const data = {
      ...formData,
      price: parseFloat(formData.price),
      cost: parseFloat(formData.cost),
      stock_quantity: parseInt(formData.stock_quantity),
      min_stock: parseInt(formData.min_stock),
    };

    try {
      if (editingProduct) {
        // Update existing product
        const updatedProducts = products.map(p => 
          p.id === editingProduct.id ? { ...p, ...data } : p
        );
        setProducts(updatedProducts);
        setSuccessMessage('Product updated successfully!');
      } else {
        // Create new product
        const newProduct = {
          id: Math.max(...products.map(p => p.id)) + 1,
          ...data
        };
        setProducts([...products, newProduct]);
        setSuccessMessage('Product created successfully!');
      }
      
      handleClose();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!permissions.canDeleteProduct) {
      setError('Permission denied. You don\'t have permission to delete products.');
      return;
    }
    
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const filteredProducts = products.filter(p => p.id !== id);
        setProducts(filteredProducts);
        setSuccessMessage('Product deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        setError('Delete operation failed');
      }
    }
  };

  return (
    <Container sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Inventory2 sx={{ mr: 2, fontSize: 40, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Inventory Management
        </Typography>
        {permissions.canCreateProduct && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => handleOpen()}
          >
            Add Product
          </Button>
        )}
      </Box>
      
      {user && (
        <Typography variant="subtitle1" sx={{ mb: 2, color: 'text.secondary' }}>
          👤 User: {user.username} | Role: {user.role}
        </Typography>
      )}
      
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.detail || "An error occurred"}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.sku}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>${product.price}</TableCell>
                <TableCell>{product.stock_quantity}</TableCell>
                <TableCell>
                  <Chip
                    label={
                      product.stock_quantity <= product.min_stock
                        ? "Low Stock"
                        : "In Stock"
                    }
                    color={
                      product.stock_quantity <= product.min_stock
                        ? "warning"
                        : "success"
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleOpen(product)}
                    color="primary"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDelete(product.id)}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingProduct ? "Edit Product" : "Add Product"}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
            <TextField
              margin="normal"
              fullWidth
              label="Description"
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
            <Box display="flex" gap={2}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Price"
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Cost"
                type="number"
                value={formData.cost}
                onChange={(e) =>
                  setFormData({ ...formData, cost: e.target.value })
                }
              />
            </Box>
            <Box display="flex" gap={2}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="SKU"
                value={formData.sku}
                onChange={(e) =>
                  setFormData({ ...formData, sku: e.target.value })
                }
              />
              <TextField
                margin="normal"
                fullWidth
                label="Barcode"
                value={formData.barcode}
                onChange={(e) =>
                  setFormData({ ...formData, barcode: e.target.value })
                }
              />
            </Box>
            <Box display="flex" gap={2}>
              <TextField
                margin="normal"
                fullWidth
                label="Category"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Stock Quantity"
                type="number"
                value={formData.stock_quantity}
                onChange={(e) =>
                  setFormData({ ...formData, stock_quantity: e.target.value })
                }
              />
              <TextField
                margin="normal"
                fullWidth
                label="Min Stock"
                type="number"
                value={formData.min_stock}
                onChange={(e) =>
                  setFormData({ ...formData, min_stock: e.target.value })
                }
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {editingProduct ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Inventory;
