import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { setAuthToken } from '../../utils/setAuthToken';

// Load user
export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get('/api/auth');
      return res.data;
    } catch (err) {
      localStorage.removeItem('token');
      return rejectWithValue(err.response.data.msg);
    }
  }
);

// Register user
export const register = createAsyncThunk(
  'auth/register',
  async (formData, { rejectWithValue }) => {
    try {
      const res = await axios.post('/api/users', formData);
      
      localStorage.setItem('token', res.data.token);
      setAuthToken(res.data.token);
      
      return res.data;
    } catch (err) {
      const errors = err.response.data.errors;
      
      if (errors) {
        return rejectWithValue(errors[0].msg);
      }
      
      return rejectWithValue(err.response.data.msg);
    }
  }
);

// Login user
export const login = createAsyncThunk(
  'auth/login',
  async (formData, { rejectWithValue }) => {
    try {
      const res = await axios.post('/api/auth', formData);
      
      localStorage.setItem('token', res.data.token);
      setAuthToken(res.data.token);
      
      return res.data;
    } catch (err) {
      const errors = err.response.data.errors;
      
      if (errors) {
        return rejectWithValue(errors[0].msg);
      }
      
      return rejectWithValue(err.response.data.msg);
    }
  }
);

// Google login
export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async (tokenId, { rejectWithValue }) => {
    try {
      const res = await axios.post('/api/auth/google', tokenId);
      
      localStorage.setItem('token', res.data.token);
      setAuthToken(res.data.token);
      
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response.data.msg);
    }
  }
);

// Facebook login
export const facebookLogin = createAsyncThunk(
  'auth/facebookLogin',
  async (userData, { rejectWithValue }) => {
    try {
      const res = await axios.post('/api/auth/facebook', userData);
      
      localStorage.setItem('token', res.data.token);
      setAuthToken(res.data.token);
      
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response.data.msg);
    }
  }
);

const initialState = {
  token: localStorage.getItem('token'),
  isAuthenticated: null,
  loading: true,
  user: null,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.user = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Load user
      .addCase(loadUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(loadUser.rejected, (state, action) => {
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.user = null;
        state.error = action.payload;
      })
      // Register user
      .addCase(register.pending, (state) => {
        state.loading = true;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(register.rejected, (state, action) => {
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.user = null;
        state.error = action.payload;
      })
      // Login user
      .addCase(login.pending, (state) => {
        state.loading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(login.rejected, (state, action) => {
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.user = null;
        state.error = action.payload;
      })
      // Google login
      .addCase(googleLogin.pending, (state) => {
        state.loading = true;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.user = null;
        state.error = action.payload;
      })
      // Facebook login
      .addCase(facebookLogin.pending, (state) => {
        state.loading = true;
      })
      .addCase(facebookLogin.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(facebookLogin.rejected, (state, action) => {
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.user = null;
        state.error = action.payload;
      });
  }
});

export const { logout, clearError } = authSlice.actions;

export default authSlice.reducer; 