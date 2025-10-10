import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import posReducer from './slices/posSlice';
import inventoryReducer from './slices/inventorySlice';

export default configureStore({
  reducer: {
    auth: authReducer,
    pos: posReducer,
    inventory: inventoryReducer,
  },
});