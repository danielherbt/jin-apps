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
  TextField,
} from '@mui/material';
import {
  TrendingUp,
  Receipt,
  AttachMoney,
  ShoppingCart,
  DateRange,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Sales = () => {
  const { user } = useAuth();
  const [dateFilter, setDateFilter] = useState('today');
  
  // Sample sales data - replace with API call
  const salesData = [
    {
      id: 'S001',
      date: '2025-10-12 09:15',
      customer: 'Walk-in Customer',
      items: 3,
      total: 549.97,
      payment_method: 'Cash',
      cashier: 'admin',
      status: 'Completed'
    },
    {
      id: 'S002', 
      date: '2025-10-12 10:30',
      customer: 'John Doe',
      items: 1,
      total: 1299.99,
      payment_method: 'Card',
      cashier: 'cashier1',
      status: 'Completed'
    },
    {
      id: 'S003',
      date: '2025-10-12 11:45',
      customer: 'Jane Smith',
      items: 2,
      total: 249.98,
      payment_method: 'Card',
      cashier: 'admin',
      status: 'Refunded'
    }
  ];
  
  const totalSales = salesData.reduce((sum, sale) => 
    sale.status === 'Completed' ? sum + sale.total : sum, 0
  );
  const totalTransactions = salesData.filter(s => s.status === 'Completed').length;
  const averageTransaction = totalSales / totalTransactions || 0;
  
  return (
    <Container>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <TrendingUp sx={{ mr: 2, fontSize: 40, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Sales & Reports
        </Typography>
      </Box>
      
      {user && (
        <Typography variant="subtitle1" sx={{ mb: 2, color: 'text.secondary' }}>
          👤 User: {user.username} | Role: {user.role}
        </Typography>
      )}
      
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <AttachMoney sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
              <Box>
                <Typography variant="h6">${totalSales.toFixed(2)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Sales
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <Receipt sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
              <Box>
                <Typography variant="h6">{totalTransactions}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Transactions
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <ShoppingCart sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
              <Box>
                <Typography variant="h6">${averageTransaction.toFixed(2)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg. Transaction
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <DateRange sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
              <Box>
                <Typography variant="h6">Today</Typography>
                <Typography variant="body2" color="text.secondary">
                  Period
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <TextField
          select
          label="Period"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          SelectProps={{ native: true }}
          size="small"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </TextField>
        <Button variant="outlined" startIcon={<Receipt />}>
          Export Report
        </Button>
      </Box>
      
      {/* Sales Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Sale ID</TableCell>
              <TableCell>Date & Time</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Payment</TableCell>
              <TableCell>Cashier</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {salesData.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell>{sale.id}</TableCell>
                <TableCell>{sale.date}</TableCell>
                <TableCell>{sale.customer}</TableCell>
                <TableCell>{sale.items}</TableCell>
                <TableCell>${sale.total.toFixed(2)}</TableCell>
                <TableCell>{sale.payment_method}</TableCell>
                <TableCell>{sale.cashier}</TableCell>
                <TableCell>
                  <Chip
                    label={sale.status}
                    color={sale.status === 'Completed' ? 'success' : 
                           sale.status === 'Refunded' ? 'error' : 'default'}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default Sales;