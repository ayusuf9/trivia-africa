import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { setAlertWithTimeout } from './alertSlice';

// Create a new game
export const createGame = createAsyncThunk(
  'game/createGame',
  async ({ quizId, settings }, { dispatch, rejectWithValue }) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const res = await axios.post('/api/games', { quizId, settings }, config);

      dispatch(setAlertWithTimeout('Game Created Successfully', 'success'));

      return res.data;
    } catch (err) {
      dispatch(setAlertWithTimeout('Failed to create game', 'error'));
      return rejectWithValue(err.response.data.msg || 'Failed to create game');
    }
  }
);

// Get game by ID
export const getGameById = createAsyncThunk(
  'game/getGameById',
  async (gameId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/api/games/${gameId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response.data.msg || 'Failed to load game');
    }
  }
);

// Join a game
export const joinGame = createAsyncThunk(
  'game/joinGame',
  async (gameCode, { dispatch, rejectWithValue }) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const res = await axios.post('/api/games/join', { gameCode }, config);

      dispatch(setAlertWithTimeout('Joined Game Successfully', 'success'));

      return res.data;
    } catch (err) {
      dispatch(setAlertWithTimeout('Failed to join game', 'error'));
      return rejectWithValue(err.response.data.msg || 'Failed to join game');
    }
  }
);

// Submit answer
export const submitAnswer = createAsyncThunk(
  'game/submitAnswer',
  async ({ gameId, questionId, answerId, timeSpent }, { rejectWithValue }) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const res = await axios.post(
        `/api/games/${gameId}/answer`,
        { questionId, answerId, timeSpent },
        config
      );

      return res.data;
    } catch (err) {
      return rejectWithValue(err.response.data.msg || 'Failed to submit answer');
    }
  }
);

// End game
export const endGame = createAsyncThunk(
  'game/endGame',
  async (gameId, { dispatch, rejectWithValue }) => {
    try {
      const res = await axios.put(`/api/games/${gameId}/end`);

      dispatch(setAlertWithTimeout('Game Ended Successfully', 'success'));

      return res.data;
    } catch (err) {
      dispatch(setAlertWithTimeout('Failed to end game', 'error'));
      return rejectWithValue(err.response.data.msg || 'Failed to end game');
    }
  }
);

// Get user's games
export const getUserGames = createAsyncThunk(
  'game/getUserGames',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get('/api/games/user');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response.data.msg || 'Failed to load games');
    }
  }
);

const initialState = {
  game: null,
  games: [],
  currentQuestion: null,
  playerResults: null,
  loading: false,
  error: null
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setCurrentQuestion: (state, action) => {
      state.currentQuestion = action.payload;
    },
    updatePlayerJoined: (state, action) => {
      if (state.game) {
        state.game.players = [...state.game.players, action.payload];
      }
    },
    updateGameState: (state, action) => {
      state.game = { ...state.game, ...action.payload };
    },
    setPlayerResults: (state, action) => {
      state.playerResults = action.payload;
    },
    clearGame: (state) => {
      state.game = null;
      state.currentQuestion = null;
      state.playerResults = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // createGame
      .addCase(createGame.pending, (state) => {
        state.loading = true;
      })
      .addCase(createGame.fulfilled, (state, action) => {
        state.game = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(createGame.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // getGameById
      .addCase(getGameById.pending, (state) => {
        state.loading = true;
      })
      .addCase(getGameById.fulfilled, (state, action) => {
        state.game = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(getGameById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // joinGame
      .addCase(joinGame.pending, (state) => {
        state.loading = true;
      })
      .addCase(joinGame.fulfilled, (state, action) => {
        state.game = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(joinGame.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // submitAnswer
      .addCase(submitAnswer.pending, (state) => {
        state.loading = true;
      })
      .addCase(submitAnswer.fulfilled, (state, action) => {
        // Update the player's answers in the game state
        if (state.game) {
          const playerIndex = state.game.players.findIndex(
            p => p.user.toString() === action.payload.playerId
          );
          
          if (playerIndex !== -1) {
            state.game.players[playerIndex].answers = action.payload.answers;
            state.game.players[playerIndex].score = action.payload.score;
          }
        }
        
        state.loading = false;
        state.error = null;
      })
      .addCase(submitAnswer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // endGame
      .addCase(endGame.pending, (state) => {
        state.loading = true;
      })
      .addCase(endGame.fulfilled, (state, action) => {
        state.game = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(endGame.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // getUserGames
      .addCase(getUserGames.pending, (state) => {
        state.loading = true;
      })
      .addCase(getUserGames.fulfilled, (state, action) => {
        state.games = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(getUserGames.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const {
  setCurrentQuestion,
  updatePlayerJoined,
  updateGameState,
  setPlayerResults,
  clearGame
} = gameSlice.actions;

export default gameSlice.reducer; 