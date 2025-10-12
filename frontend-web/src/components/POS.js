import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { getProducts } from '../store/slices/inventorySlice';
import { addItemToSale, removeItemFromSale, createSale, clearSale } from '../store/slices/posSlice';

const POS = () => {
  const dispatch = useDispatch();
  const { products } = useSelector((state) => state.inventory);
  const { currentSale, loading: saleLoading } = useSelector((state) => state.pos);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    dispatch(getProducts());
  }, [dispatch]);

  const handleAddItem = () => {
    const product = products && products.find(p => p.id === parseInt(selectedProduct));
    if (product && quantity > 0) {
      dispatch(addItemToSale({
        product_id: product.id,
        product_name: product.name,
        quantity: parseInt(quantity),
        unit_price: product.price,
        total_price: product.price * parseInt(quantity),
      }));
      setSelectedProduct('');
      setQuantity(1);
    }
  };

  const handleRemoveItem = (productId) => {
    dispatch(removeItemFromSale(productId));
  };

  const handleCompleteSale = async () => {
    if (currentSale.items.length > 0) {
      const saleData = {
        items: currentSale.items,
        branch_id: 1, // Should come from user context
        user_id: 1, // Should come from auth context
        payment_method: 'cash',
        discount_amount: currentSale.discount,
      };

      try {
        await dispatch(createSale(saleData)).unwrap();
        dispatch(clearSale());
        alert('Sale completed successfully!');
      } catch (error) {
        alert('Error completing sale: ' + error.detail);
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Point of Sale
      </Typography>

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
                disabled={currentSale.items.length === 0 || saleLoading}
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