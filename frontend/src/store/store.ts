import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import playerReducer from './playerSlice';
import songsReducer from './songSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    player: playerReducer,
    songs: songsReducer
  },
});

// Types for use in components
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;