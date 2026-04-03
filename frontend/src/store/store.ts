import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import playerReducer, { clearTrack } from './playerSlice';
import songsReducer from './songSlice';
import artistReducer from './artistSlice';
import historyReducer, { recordPlay } from './historySlice';
import { loadPlayerState, savePlayerState } from './persistence';

const listeners = createListenerMiddleware();

const savedPlayerState = loadPlayerState();

export const store = configureStore({
  reducer: {
    auth: authReducer,
    player: playerReducer,
    songs: songsReducer,
    artists: artistReducer,
    history: historyReducer,
  },
  preloadedState: savedPlayerState ? { player: savedPlayerState as any } : undefined,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(listeners.middleware),
});

// Listeners are registered AFTER configureStore. String type matchers are used
// instead of actionCreator references to avoid circular-dependency TDZ issues:
// playerSlice → api.ts → store.ts → playerSlice (setTrack not yet exported).

listeners.startListening({
  type: 'songs/fetchFilteredSongs/fulfilled',
  effect: (action: any, api) => {
    const state = api.getState() as { player: { currentTrack: { id: string } | null } };
    const { currentTrack } = state.player;
    const songs: { id: string }[] = action.payload ?? [];
    if (currentTrack && !songs.some((s) => s.id === currentTrack.id)) {
      api.dispatch(clearTrack());
    }
  },
});

listeners.startListening({
  type: 'player/setTrack',
  effect: async (action: any, api) => {
    api.cancelActiveListeners();
    await api.delay(30_000);
    const state = api.getState() as { player: { currentTrack: { id: string } | null } };
    if (state.player.currentTrack?.id === action.payload.id) {
      api.dispatch(recordPlay(action.payload.id));
    }
  },
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
