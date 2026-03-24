import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';
import { SongState, FilterType } from './types';
import { snackbar } from '../services/snackbar';
import { fetchSelectedPlaylist } from './playerSlice';

export const fetchFilterOptions = createAsyncThunk(
  'songs/fetchFilterOptions',
  async (type: string) => {
    try {
      const res = await api.get(`songs/${type}s`);
      return { type, options: res.data }
    } catch (error) {
      return error;
    }
  }
);

export const fetchFilteredSongs = createAsyncThunk(
  'songs/fetchFilteredSongs',
  async ({ type, value }: { type: string; value: string }) => {
    let url = 'songs';
    if (type !== 'all' && value) url += `?${type}=${encodeURIComponent(value)}`;

    try {
      const res = await api.get(url);
      return res.data;
    } catch (error) {
      console.log("🚀 ~ error:", error);
    }
  }
);

export const downloadSong = createAsyncThunk(
  'songs/downloadSong',
  async (song: any) => {
    try {
      const res = await api.get(`/songs/${song.id}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${song.artist} - ${song.title}.mp3`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.log("🚀 ~ error:", error);
    }
  }
);

export const deleteSong = createAsyncThunk(
  'songs/deleteSong',
  async (songId: string, { dispatch, getState, rejectWithValue }) => {
    try {
      await api.delete(`/songs/${songId}`);
      const state = getState() as { player: { selectedPlaylistId: string | null }; songs: SongState };
      if (state.player.selectedPlaylistId) {
        dispatch(fetchSelectedPlaylist(state.player.selectedPlaylistId));
      }
      dispatch(fetchFilterOptions('artist'));
      dispatch(fetchFilterOptions('genre'));
      return songId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete song');
    }
  }
);

export const fetchLikedSongs = createAsyncThunk(
  'songs/fetchLikedSongs',
  async () => {
    const res = await api.get('/songs/liked');
    return (res.data as any[]).map((song: any) => song.id);
  }
);

export const likeSong = createAsyncThunk(
  'songs/likeSong',
  async (songId: string, { rejectWithValue }) => {
    try {
      await api.post(`/songs/${songId}/like`);
      snackbar.show({ message: 'Song liked', color: 'bg-green-500' });
      return songId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to like song');
    }
  }
);

export const unlikeSong = createAsyncThunk(
  'songs/unlikeSong',
  async (songId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/songs/${songId}/like`);
      snackbar.show({ message: 'Song unliked', color: 'bg-yellow-500' });
      return songId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to unlike song');
    }
  }
);

export const uploadSong = createAsyncThunk(
  'songs/uploadSong',
  async (formData: FormData, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post('/songs/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      snackbar.show({ message: 'Song uploaded successfully', color: 'bg-green-500' });
      dispatch(fetchFilterOptions('artist'));
      dispatch(fetchFilterOptions('genre'));
      return res.data;
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to upload song';
      snackbar.show({ message: msg, color: 'bg-red-500' });
      return rejectWithValue(msg);
    }
  }
);

export const updateSong = createAsyncThunk(
  'songs/updateSong',
  async ({ songId, data }: { songId: string; data: Record<string, any> }, { dispatch, getState, rejectWithValue }) => {
    try {
      const res = await api.put(`/songs/${songId}`, data);
      snackbar.show({ message: 'Song updated', color: 'bg-green-500' });
      const state = getState() as { player: { selectedPlaylistId: string | null }; songs: SongState };
      if (state.player.selectedPlaylistId) {
        dispatch(fetchSelectedPlaylist(state.player.selectedPlaylistId));
      }
      dispatch(fetchFilterOptions('artist'));
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update song');
    }
  }
);

const initialState: SongState = {
  filterOptions: { artist: [], genre: [] },
  filter: { type: 'all', value: '' },
  songs: [],
  likedSongIds: [],
};

const songSlice = createSlice({
  name: 'songs',
  initialState,
  reducers: {
    setSongFilter(state, action) {
      state.filter = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchFilterOptions.fulfilled, (state, action) => {
        const type = action.payload.type as FilterType;
        if (type === 'artist' || type === 'genre') {
          state.filterOptions[type] = action.payload.options;
        }
      })
      .addCase(fetchFilteredSongs.fulfilled, (state, action) => {
        if (action.payload &&action.payload.status !== 404) {
          console.log("🚀 ~ action.payload:", action.payload)
          state.songs = action.payload.sort((a: any, b: any) => a.title.localeCompare(b.title));
        }
      })
      .addCase(downloadSong.fulfilled, (state, action) => {
        // Handle successful download if needed
      })
      .addCase(deleteSong.fulfilled, (state, action) => {
        state.songs = state.songs.filter(song => song.id !== action.payload);
      })
      .addCase(fetchLikedSongs.fulfilled, (state, action) => {
        state.likedSongIds = action.payload;
      })
      .addCase(likeSong.fulfilled, (state, action) => {
        if (!state.likedSongIds.includes(action.payload)) {
          state.likedSongIds.push(action.payload);
        }
      })
      .addCase(unlikeSong.fulfilled, (state, action) => {
        state.likedSongIds = state.likedSongIds.filter(id => id !== action.payload);
      })
      .addCase(uploadSong.fulfilled, (state, action) => {
        if (action.payload) {
          state.songs.push(action.payload);
          state.songs.sort((a: any, b: any) => a.title.localeCompare(b.title));
        }
      })
      .addCase(updateSong.fulfilled, (state, action) => {
        const index = state.songs.findIndex(song => song.id === action.payload.id);
        if (index !== -1) {
          state.songs[index] = action.payload;
        }
      });
  },
});
export const { setSongFilter } = songSlice.actions;
export default songSlice.reducer;