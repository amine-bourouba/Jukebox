import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';
import { SongState, FilterType } from './types';

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

const initialState: SongState = {
  filterOptions: { artist: [], genre: [] },
  filter: { type: 'all', value: '' },
  songs: [],
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
      });
  },
});
export const { setSongFilter } = songSlice.actions;
export default songSlice.reducer;