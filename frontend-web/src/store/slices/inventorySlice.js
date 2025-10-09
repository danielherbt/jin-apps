import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const POS_API_BASE_URL = process.env.REACT_APP_POS_API_URL || 'http://localhost:8001';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

export const getProducts = createAsyncThunk(
  'inventory/getProducts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${POS_API_BASE_URL}/api/v1/inventory/`, {
        headers: getAuthHeaders(),
        params,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createProduct = createAsyncThunk(
  'inventory/createProduct',
  async (productData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${POS_API_BASE_URL}/api/v1/inventory/`, productData, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const inventorySlice = createSlice({
  name: 'inventory',
  initialState: {
    products: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(getProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products.push(action.payload);
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default inventorySlice.reducer;