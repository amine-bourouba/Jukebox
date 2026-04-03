import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import playerReducer, { clearTrack } from './playerSlice';
import songsReducer, { fetchFilteredSongs } from './songSlice';
import artistReducer from './artistSlice';
import { loadPlayerState, savePlayerState } from './persistence';

const staleTrackListener = createListenerMiddleware();

// Clear a rehydrated currentTrack if the song no longer exists in the library
staleTrackListener.startListening({
  actionCreator: fetchFilteredSongs.fulfilled,
  effect: (action, api) => {
    const state = api.getState() as { player: { currentTrack: { id: string } | null } };
    const { currentTrack } = state.player;
    const songs: { id: string }[] = action.payload ?? [];
    if (currentTrack && !songs.some((s) => s.id === currentTrack.id)) {
      api.dispatch(clearTrack());
    }
  },
});

const savedPlayerState = loadPlayerState();

export const store = configureStore({
  reducer: {
    auth: authReducer,
    player: playerReducer,
    songs: songsReducer,
    artists: artistReducer,
  },
  preloadedState: savedPlayerState ? { player: savedPlayerState as any } : undefined,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(staleTrackListener.middleware),
});

// Persist player state to localStorage on every change (debounced)
let debounceTimer: ReturnType<typeof setTimeout>;
store.subscribe(() => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    savePlayerState(store.getState().player);
  }, 300);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
