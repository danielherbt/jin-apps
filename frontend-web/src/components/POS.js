import { useState } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Box,
  Alert,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon, ShoppingCart, Receipt } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { usePOSPermissions } from '../hooks/usePermissions';

const POS = () => {
  const { user } = useAuth();
  const permissions = usePOSPermissions();
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [currentSale, setCurrentSale] = useState({ 
    items: [], 
    total: 0, 
    tax: 0, 
    discount: 0 
  });
  const [successMessage, setSuccessMessage] = useState('');
  
  // Sample products - replace with API call
  const products = [
    { id: 1, name: 'Laptop Dell XPS 13', price: 1299.99, stock: 5 },
    { id: 2, name: 'Mouse Logitech MX Master', price: 99.99, stock: 15 },
    { id: 3, name: 'Keyboard Mechanical RGB', price: 149.99, stock: 8 },
    { id: 4, name: 'Monitor 27 4K', price: 399.99, stock: 3 },
    { id: 5, name: 'Webcam HD 1080p', price: 79.99, stock: 12 }
  ];

  // Calculate totals
  const calculateTotals = (items) => {
    const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
    const tax = subtotal * 0.12; // 12% tax
    return { total: subtotal, tax };
  };

  const handleAddItem = () => {
    if (!permissions.canCreateSale) {
      setSuccessMessage('You do not have permission to create sales.');
      setTimeout(() => setSuccessMessage(''), 3000);
      return;
    }
    
    const product = products.find(p => p.id === parseInt(selectedProduct));
    if (product && quantity > 0) {
      const existingItemIndex = currentSale.items.findIndex(
        item => item.product_id === product.id
      );
      
      let newItems;
      if (existingItemIndex >= 0) {
        // Update existing item
        newItems = [...currentSale.items];
        newItems[existingItemIndex].quantity += parseInt(quantity);
        newItems[existingItemIndex].total_price = 
          newItems[existingItemIndex].quantity * product.price;
      } else {
        // Add new item
        const newItem = {
          product_id: product.id,
          product_name: product.name,
          quantity: parseInt(quantity),
          unit_price: product.price,
          total_price: product.price * parseInt(quantity),
        };
        newItems = [...currentSale.items, newItem];
      }
      
      const totals = calculateTotals(newItems);
      setCurrentSale({ 
        items: newItems, 
        ...totals,
        discount: currentSale.discount 
      });
      setSelectedProduct('');
      setQuantity(1);
    }
  };

  const handleRemoveItem = (productId) => {
    const newItems = currentSale.items.filter(item => item.product_id !== productId);
    const totals = calculateTotals(newItems);
    setCurrentSale({ 
      items: newItems, 
      ...totals,
      discount: currentSale.discount 
    });
  };

  const handleCompleteSale = async () => {
    if (!permissions.canCreateSale) {
      setSuccessMessage('You do not have permission to complete sales.');
      setTimeout(() => setSuccessMessage(''), 3000);
      return;
    }
    
    if (currentSale.items.length > 0) {
      // Simulate API call
      setSuccessMessage(
        `Sale completed successfully! Total: $${(currentSale.total + currentSale.tax).toFixed(2)} - User: ${user?.username}`
      );
      
      // Clear sale after 3 seconds
      setTimeout(() => {
        setCurrentSale({ items: [], total: 0, tax: 0, discount: 0 });
        setSuccessMessage('');
      }, 3000);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <ShoppingCart sx={{ mr: 2, fontSize: 40, color: 'primary.main' }} />
        <Typography variant="h4" gutterBottom sx={{ m: 0 }}>
          Point of Sale System
        </Typography>
      </Box>
      
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}
      
      {user && (
        <Typography variant="subtitle1" sx={{ mb: 2, color: 'text.secondary' }}>
          👤 Cashier: {user.username} | Role: {user.role}
        </Typography>
      )}

      <Grid container spacing={3}>
        {/* Product Selection */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Add Product
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  select
                  label="Product"
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  SelectProps={{ native: true }}
                  fullWidth
                >
                  <option value="">Select a product</option>
                  {products && products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - ${product.price}
                    </option>
                  ))}
                </TextField>
                <TextField
                  label="Quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  inputProps={{ min: 1 }}
                  sx={{ width: 100 }}
                />
                <Button
                  variant="contained"
                  onClick={handleAddItem}
                  disabled={!selectedProduct}
                >
                  <AddIcon />
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Current Sale */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Sale
              </Typography>
              <List>
                {currentSale.items.map((item) => (
                  <ListItem key={item.product_id}>
                    <ListItemText
                      primary={item.product_name}
                      secondary={`Qty: ${item.quantity} × $${item.unit_price}`}
                    />
                    <ListItemSecondaryAction>
                      <Typography variant="body1" sx={{ mr: 2 }}>
                        ${item.total_price.toFixed(2)}
                      </Typography>
                      <IconButton
                        edge="end"
                        onClick={() => handleRemoveItem(item.product_id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Subtotal:</Typography>
                <Typography>${currentSale.total.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Tax (12%):</Typography>
                <Typography>${currentSale.tax.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6">
                  ${(currentSale.total + currentSale.tax).toFixed(2)}
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleCompleteSale}
                disabled={currentSale.items.length === 0}
                startIcon={<Receipt />}
                sx={{ py: 1.5 }}
              >
                Complete Sale
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default POS;