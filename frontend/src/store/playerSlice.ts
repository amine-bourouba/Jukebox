import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import api from '../services/api';
import { PlayerState, Track } from './types';
import { snackbar } from '../services/snackbar';


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
  try {
    const res = await api.get('/playlists');
    return res.data;
  } catch (error) {
    return [];
  }
});

export const fetchSelectedPlaylist = createAsyncThunk(
  'player/fetchSelectedPlaylist',
  async (playlistId: string) => {
    try {
      const res = await api.get(`/playlists/${playlistId}`);
      return { playlistId, songs: res.data };
    } catch (error) {
      return { playlistId, songs: { playlistSongs: [] } };
    }
  }
);

export const addSongToPlaylist = createAsyncThunk(
  'player/addSongToPlaylist',
  async ({ playlistId, songId }: { playlistId: string; songId: string }, { dispatch, getState }) => {
    try {
      await api.post(`/playlists/${playlistId}/songs`, { songId });
      const state = getState() as { player: PlayerState };
      if (state.player.selectedPlaylistId === playlistId) {
        dispatch(fetchSelectedPlaylist(playlistId));
      }
      snackbar.show({
        message: 'Song added!',
        color: 'bg-green-500'
      });
    } catch (error) {
      snackbar.show({ message: 'Failed to add song', color: 'bg-red-500' });
    }
  }
);

export const removeSongFromPlaylist = createAsyncThunk(
  'player/removeSongFromPlaylist',
  async ({ playlistId, songId }: { playlistId: string; songId: string }, { dispatch, getState }) => {
    try {
      await api.delete(`/playlists/${playlistId}/songs/${songId}`);
      const state = getState() as { player: PlayerState };
      if (state.player.selectedPlaylistId === playlistId) {
        dispatch(fetchSelectedPlaylist(playlistId));
      }
      return { playlistId, songId };
    } catch (error) {
      snackbar.show({ message: 'Failed to remove song', color: 'bg-red-500' });
    }
  }
);

export const playPlaylist = createAsyncThunk(
  'player/playPlaylist',
  async (playlistId: string, { dispatch }) => {
    const res = await api.get(`/playlists/${playlistId}`);
    const songs = res.data.playlistSongs?.map((ps: any) => ({
      ...ps.song,
      coverUrl: ps.song.coverImageUrl || ps.song.thumbnail,
    })) ?? [];
    if (songs.length === 0) {
      snackbar.show({ message: 'Playlist is empty', color: 'bg-yellow-500' });
      return;
    }
    dispatch(setQueue(songs));
    dispatch(setTrack(songs[0]));
  }
);

export const deletePlaylist = createAsyncThunk(
  'player/deletePlaylist',
  async (playlistId: string, { dispatch, rejectWithValue }) => {
    try {
      await api.delete(`/playlists/${playlistId}`);
      snackbar.show({ message: 'Playlist deleted', color: 'bg-green-500' });
      dispatch(fetchPlaylists());
      return playlistId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete playlist');
    }
  }
);

export const createPlaylist = createAsyncThunk(
  'player/createPlaylist',
  async (data: { title: string; description?: string }, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post('/playlists', data);
      snackbar.show({ message: 'Playlist created', color: 'bg-green-500' });
      dispatch(fetchPlaylists());
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create playlist');
    }
  }
);

export const updatePlaylist = createAsyncThunk(
  'player/updatePlaylist',
  async ({ playlistId, data }: { playlistId: string; data: { title?: string; description?: string } }, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.put(`/playlists/${playlistId}`, data);
      snackbar.show({ message: 'Playlist updated', color: 'bg-green-500' });
      dispatch(fetchPlaylists());
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update playlist');
    }
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
    addToQueue(state, action: PayloadAction<Track>) {
      state.queue.push(action.payload);
      snackbar.show({ message: `"${action.payload.title}" added to queue`, color: 'bg-green-500' });
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
      })
      .addCase(deletePlaylist.fulfilled, (state, action) => {
        if (state.selectedPlaylistId === action.payload) {
          state.selectedPlaylistId = null;
          state.selectedPlaylist = null;
        }
      });
  }
});

export const { setTrack, clearTrack, setQueue, addToQueue, setRepeat, setShuffle, setSelectedPlaylist } = playerSlice.actions;
export default playerSlice.reducer;