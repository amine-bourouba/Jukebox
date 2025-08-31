import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchFilterOptions = createAsyncThunk(
  'songs/fetchFilterOptions',
  async (type: string) => {
    const res = await fetch(`/api/songs/${type}s`);
    return { type, options: await res.json() };
  }
);

export const fetchFilteredSongs = createAsyncThunk(
  'songs/fetchFilteredSongs',
  async ({ type, value }: { type: string; value: string }) => {
    let url = '/api/songs';
    if (type !== 'all' && value) url += `?${type}=${encodeURIComponent(value)}`;
    const res = await fetch(url);
    return await res.json();
  }
);

type FilterType = 'artist' | 'genre';

interface SongState {
  filterOptions: Record<FilterType, any[]>;
  filter: { type: string; value: string };
  songs: any[];
}

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