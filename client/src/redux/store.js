import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import profileReducer from './slices/profileSlice';
import quizReducer from './slices/quizSlice';
import gameReducer from './slices/gameSlice';
import alertReducer from './slices/alertSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    quiz: quizReducer,
    game: gameReducer,
    alert: alertReducer
  },
  devTools: process.env.NODE_ENV !== 'production'
});

export default store; 