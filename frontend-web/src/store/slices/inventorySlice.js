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

export const updateProduct = createAsyncThunk(
  'inventory/updateProduct',
  async ({ id, productData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${POS_API_BASE_URL}/api/v1/inventory/${id}`, productData, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'inventory/deleteProduct',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${POS_API_BASE_URL}/api/v1/inventory/${id}`, {
        headers: getAuthHeaders(),
      });
      return id;
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
      })
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.products.findIndex(product => product.id === action.payload.id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products = state.products.filter(product => product.id !== action.payload);
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default inventorySlice.reducer;