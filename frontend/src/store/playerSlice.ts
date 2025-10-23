import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import api from '../services/api';
import { PlayerState, Track } from './types';

const initialState: PlayerState = {
  currentTrack: null,
  queue: [],
  repeat: 'off',
  shuffle: false,
  playlists: [],
  selectedPlaylistId: null,
  selectedPlaylist: null,
};

export const fetchPlaylists = createAsyncThunk('player/fetchPlaylists', async () => {
  const res = await api.get('/playlists');
  return res.data;
});

export const fetchSelectedPlaylist = createAsyncThunk(
  'player/fetchSelectedPlaylist',
  async (playlistId: string) => {
    const res = await api.get(`/playlists/${playlistId}`);
    return { playlistId, songs: res.data };
  }
);

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    setTrack(state, action: PayloadAction<Track>) {
      state.currentTrack = action.payload;
    },
    clearTrack(state) {
      state.currentTrack = null;
    },
    setQueue(state, action: PayloadAction<Track[]>) {
      state.queue = action.payload;
    },
    setRepeat(state, action: PayloadAction<'off' | 'one' | 'all'>) {
      state.repeat = action.payload;
    },
    setShuffle(state, action: PayloadAction<boolean>) {
      state.shuffle = action.payload;
    },
    setSelectedPlaylist(state, action) {
      state.selectedPlaylistId = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchPlaylists.fulfilled, (state, action) => {
        state.playlists = action.payload;
      })
      .addCase(fetchSelectedPlaylist.fulfilled, (state, action) => {
        state.selectedPlaylistId = action.payload.playlistId;
        state.selectedPlaylist = action.payload.songs;
      });
  }
});

export const { setTrack, clearTrack, setQueue, setRepeat, setShuffle, setSelectedPlaylist } = playerSlice.actions;
export default playerSlice.reducer;