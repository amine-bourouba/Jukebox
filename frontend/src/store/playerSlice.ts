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

export const removeSongFromPlaylist = createAsyncThunk(
  'player/removeSongFromPlaylist',
  async ({ playlistId, songId }: { playlistId: string; songId: string }) => {
    await api.delete(`/playlists/${playlistId}/songs/${songId}`);
    return { playlistId, songId };
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
      })
      .addCase(removeSongFromPlaylist.fulfilled, (state, action) => {
        // Update selectedPlaylist if it matches
        if (
          state.selectedPlaylistId === action.payload.playlistId &&
          Array.isArray(state.selectedPlaylist)
        ) {
          state.selectedPlaylist = state.selectedPlaylist.filter(
            (song: any) => song.id !== action.payload.songId
          );
        }
        // Update playlists array if you keep songs there too
        // if (Array.isArray(state.playlists)) {
        //   const playlist = state.playlists.find(
        //     (pl: any) => pl.id === action.payload.playlistId
        //   );
        //   if (playlist && Array.isArray(playlist.songs)) {
        //     playlist.songs = playlist.songs.filter(
        //       (song: any) => song.id !== action.payload.songId
        //     );
        //   }
        // }
        //TODO: Double check the work logic above
      });
  }
});

export const { setTrack, clearTrack, setQueue, setRepeat, setShuffle, setSelectedPlaylist } = playerSlice.actions;
export default playerSlice.reducer;