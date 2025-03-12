import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { setAlertWithTimeout } from './alertSlice';

// Get current user's profile
export const getCurrentProfile = createAsyncThunk(
  'profile/getCurrentProfile',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get('/api/profile/me');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response.data.msg || 'Failed to load profile');
    }
  }
);

// Get profile by user ID
export const getProfileById = createAsyncThunk(
  'profile/getProfileById',
  async (userId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/api/profile/user/${userId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response.data.msg || 'Failed to load profile');
    }
  }
);

// Create or update profile
export const createProfile = createAsyncThunk(
  'profile/createProfile',
  async ({ formData, navigate, edit = false }, { dispatch, rejectWithValue }) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const res = await axios.post('/api/profile', formData, config);

      dispatch(setAlertWithTimeout(edit ? 'Profile Updated' : 'Profile Created', 'success'));

      if (!edit) {
        navigate('/dashboard');
      }

      return res.data;
    } catch (err) {
      const errors = err.response.data.errors;

      if (errors) {
        errors.forEach(error => dispatch(setAlertWithTimeout(error.msg, 'error')));
      }

      return rejectWithValue(err.response.data.msg || 'Failed to update profile');
    }
  }
);

// Update avatar
export const updateAvatar = createAsyncThunk(
  'profile/updateAvatar',
  async (formData, { dispatch, rejectWithValue }) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };

      const res = await axios.post('/api/profile/avatar', formData, config);

      dispatch(setAlertWithTimeout('Avatar Updated', 'success'));

      return res.data;
    } catch (err) {
      dispatch(setAlertWithTimeout('Failed to update avatar', 'error'));
      return rejectWithValue(err.response.data.msg || 'Failed to update avatar');
    }
  }
);

const initialState = {
  profile: null,
  profiles: [],
  loading: true,
  error: null
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearProfile: (state) => {
      state.profile = null;
      state.loading = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // getCurrentProfile
      .addCase(getCurrentProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCurrentProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(getCurrentProfile.rejected, (state, action) => {
        state.profile = null;
        state.loading = false;
        state.error = action.payload;
      })
      // getProfileById
      .addCase(getProfileById.pending, (state) => {
        state.loading = true;
      })
      .addCase(getProfileById.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(getProfileById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // createProfile
      .addCase(createProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(createProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(createProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // updateAvatar
      .addCase(updateAvatar.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateAvatar.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(updateAvatar.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearProfile } = profileSlice.actions;

export default profileSlice.reducer; 