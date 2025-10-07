import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const POS_API_BASE_URL = process.env.REACT_APP_POS_API_URL || 'http://localhost:8001';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

export const createSale = createAsyncThunk(
  'pos/createSale',
  async (saleData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${POS_API_BASE_URL}/api/v1/sales/`, saleData, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const getSales = createAsyncThunk(
  'pos/getSales',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${POS_API_BASE_URL}/api/v1/sales/`, {
        headers: getAuthHeaders(),
        params,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const posSlice = createSlice({
  name: 'pos',
  initialState: {
    currentSale: {
      items: [],
      total: 0,
      tax: 0,
      discount: 0,
    },
    sales: [],
    loading: false,
    error: null,
  },
  reducers: {
    addItemToSale: (state, action) => {
      const item = action.payload;
      const existingItem = state.currentSale.items.find(i => i.product_id === item.product_id);
      if (existingItem) {
        existingItem.quantity += item.quantity;
        existingItem.total_price = existingItem.quantity * existingItem.unit_price;
      } else {
        state.currentSale.items.push(item);
      }
      state.currentSale.total = state.currentSale.items.reduce((sum, item) => sum + item.total_price, 0);
      state.currentSale.tax = state.currentSale.total * 0.12;
    },
    removeItemFromSale: (state, action) => {
      const productId = action.payload;
      state.currentSale.items = state.currentSale.items.filter(item => item.product_id !== productId);
      state.currentSale.total = state.currentSale.items.reduce((sum, item) => sum + item.total_price, 0);
      state.currentSale.tax = state.currentSale.total * 0.12;
    },
    clearSale: (state) => {
      state.currentSale = {
        items: [],
        total: 0,
        tax: 0,
        discount: 0,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createSale.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSale.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSale = {
          items: [],
          total: 0,
          tax: 0,
          discount: 0,
        };
      })
      .addCase(createSale.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getSales.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSales.fulfilled, (state, action) => {
        state.loading = false;
        state.sales = action.payload;
      })
      .addCase(getSales.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { addItemToSale, removeItemFromSale, clearSale } = posSlice.actions;
export default posSlice.reducer;