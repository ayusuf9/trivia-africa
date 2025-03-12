import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { setAlertWithTimeout } from './alertSlice';

// Get all quizzes
export const getQuizzes = createAsyncThunk(
  'quiz/getQuizzes',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get('/api/quizzes');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response.data.msg || 'Failed to load quizzes');
    }
  }
);

// Get quiz by ID
export const getQuizById = createAsyncThunk(
  'quiz/getQuizById',
  async (quizId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/api/quizzes/${quizId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response.data.msg || 'Failed to load quiz');
    }
  }
);

// Create a new quiz
export const createQuiz = createAsyncThunk(
  'quiz/createQuiz',
  async (formData, { dispatch, rejectWithValue }) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const res = await axios.post('/api/quizzes', formData, config);

      dispatch(setAlertWithTimeout('Quiz Created Successfully', 'success'));

      return res.data;
    } catch (err) {
      const errors = err.response.data.errors;

      if (errors) {
        errors.forEach(error => dispatch(setAlertWithTimeout(error.msg, 'error')));
      }

      return rejectWithValue(err.response.data.msg || 'Failed to create quiz');
    }
  }
);

// Update a quiz
export const updateQuiz = createAsyncThunk(
  'quiz/updateQuiz',
  async ({ quizId, formData }, { dispatch, rejectWithValue }) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const res = await axios.put(`/api/quizzes/${quizId}`, formData, config);

      dispatch(setAlertWithTimeout('Quiz Updated Successfully', 'success'));

      return res.data;
    } catch (err) {
      const errors = err.response.data.errors;

      if (errors) {
        errors.forEach(error => dispatch(setAlertWithTimeout(error.msg, 'error')));
      }

      return rejectWithValue(err.response.data.msg || 'Failed to update quiz');
    }
  }
);

// Delete a quiz
export const deleteQuiz = createAsyncThunk(
  'quiz/deleteQuiz',
  async (quizId, { dispatch, rejectWithValue }) => {
    try {
      await axios.delete(`/api/quizzes/${quizId}`);

      dispatch(setAlertWithTimeout('Quiz Deleted', 'success'));

      return quizId;
    } catch (err) {
      dispatch(setAlertWithTimeout('Failed to delete quiz', 'error'));
      return rejectWithValue(err.response.data.msg || 'Failed to delete quiz');
    }
  }
);

// Get quizzes by category
export const getQuizzesByCategory = createAsyncThunk(
  'quiz/getQuizzesByCategory',
  async (categoryId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/api/quizzes/category/${categoryId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response.data.msg || 'Failed to load quizzes');
    }
  }
);

const initialState = {
  quizzes: [],
  quiz: null,
  loading: false,
  error: null
};

const quizSlice = createSlice({
  name: 'quiz',
  initialState,
  reducers: {
    clearQuiz: (state) => {
      state.quiz = null;
    },
    clearQuizzes: (state) => {
      state.quizzes = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // getQuizzes
      .addCase(getQuizzes.pending, (state) => {
        state.loading = true;
      })
      .addCase(getQuizzes.fulfilled, (state, action) => {
        state.quizzes = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(getQuizzes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // getQuizById
      .addCase(getQuizById.pending, (state) => {
        state.loading = true;
      })
      .addCase(getQuizById.fulfilled, (state, action) => {
        state.quiz = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(getQuizById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // createQuiz
      .addCase(createQuiz.pending, (state) => {
        state.loading = true;
      })
      .addCase(createQuiz.fulfilled, (state, action) => {
        state.quizzes.unshift(action.payload);
        state.loading = false;
        state.error = null;
      })
      .addCase(createQuiz.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // updateQuiz
      .addCase(updateQuiz.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateQuiz.fulfilled, (state, action) => {
        state.quizzes = state.quizzes.map(quiz => 
          quiz._id === action.payload._id ? action.payload : quiz
        );
        state.quiz = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(updateQuiz.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // deleteQuiz
      .addCase(deleteQuiz.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteQuiz.fulfilled, (state, action) => {
        state.quizzes = state.quizzes.filter(quiz => quiz._id !== action.payload);
        state.loading = false;
        state.error = null;
      })
      .addCase(deleteQuiz.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // getQuizzesByCategory
      .addCase(getQuizzesByCategory.pending, (state) => {
        state.loading = true;
      })
      .addCase(getQuizzesByCategory.fulfilled, (state, action) => {
        state.quizzes = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(getQuizzesByCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearQuiz, clearQuizzes } = quizSlice.actions;

export default quizSlice.reducer; 