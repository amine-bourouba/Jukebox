import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../services/api';

export interface HistoryItem {
  id: string;
  songId: string;
  playedAt: string;
  song: {
    id: string;
    title: string;
    artist: string;
    coverImageUrl?: string;
  };
}

export interface HistoryState {
  items: HistoryItem[];
  loading: boolean;
}

const initialState: HistoryState = {
  items: [],
  loading: false,
};

export const fetchHistory = createAsyncThunk('history/fetchHistory', async () => {
  const res = await api.get('/analytics/history?take=10');
  return res.data as HistoryItem[];
});

export const recordPlay = createAsyncThunk(
  'history/recordPlay',
  async (songId: string) => {
    const res = await api.post('/analytics/play', { songId });
    return res.data as { id: string; songId: string; playedAt: string };
  },
);

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHistory.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchHistory.rejected, (state) => {
        state.loading = false;
      });
  },
});

export default historySlice.reducer;
