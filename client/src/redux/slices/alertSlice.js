import { createSlice } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

const initialState = [];

const alertSlice = createSlice({
  name: 'alert',
  initialState,
  reducers: {
    setAlert: {
      reducer: (state, action) => {
        state.push(action.payload);
      },
      prepare: (msg, type, timeout = 5000) => {
        const id = uuidv4();
        return {
          payload: {
            id,
            msg,
            type
          },
          meta: {
            id,
            timeout
          }
        };
      }
    },
    removeAlert: (state, action) => {
      return state.filter(alert => alert.id !== action.payload);
    }
  }
});

// Thunk to set an alert with automatic removal after timeout
export const setAlertWithTimeout = (msg, type, timeout = 5000) => (dispatch) => {
  const { setAlert, removeAlert } = alertSlice.actions;
  const { payload, meta } = setAlert(msg, type, timeout);
  
  dispatch(setAlert(msg, type, timeout));
  
  setTimeout(() => {
    dispatch(removeAlert(meta.id));
  }, meta.timeout);
};

export const { setAlert, removeAlert } = alertSlice.actions;

export default alertSlice.reducer; 