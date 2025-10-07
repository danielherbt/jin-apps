import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import posReducer from './slices/posSlice';

export default configureStore({
  reducer: {
    auth: authReducer,
    pos: posReducer,
  },
});