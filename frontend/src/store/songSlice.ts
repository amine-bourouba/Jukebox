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
      console.log("🚀 ~ error:", error);
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
      return error;
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
        state.songs = action.payload.sort((a: any, b: any) => a.title.localeCompare(b.title));
      });
  },
});
export const { setSongFilter } = songSlice.actions;
export default songSlice.reducer;