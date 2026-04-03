import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export interface Artist {
  id: string;
  name: string;
  imageUrl?: string;
  bio?: string;
  _count: { songs: number; followers: number };
}

export interface ArtistState {
  artists: Artist[];
  selectedArtistId: string | null;
  followedArtistIds: string[];
  loading: boolean;
}

const initialState: ArtistState = {
  artists: [],
  selectedArtistId: null,
  followedArtistIds: [],
  loading: false,
};

export const fetchArtists = createAsyncThunk('artists/fetchArtists', async () => {
  const res = await api.get('/artists');
  return res.data as Artist[];
});

export const fetchFollowedArtists = createAsyncThunk('artists/fetchFollowed', async () => {
  const res = await api.get('/artists/followed');
  return (res.data as Artist[]).map(a => a.id);
});

export const followArtist = createAsyncThunk('artists/follow', async (artistId: string) => {
  await api.post(`/artists/${artistId}/follow`);
  return artistId;
});

export const unfollowArtist = createAsyncThunk('artists/unfollow', async (artistId: string) => {
  await api.delete(`/artists/${artistId}/follow`);
  return artistId;
});

const artistSlice = createSlice({
  name: 'artists',
  initialState,
  reducers: {
    setSelectedArtistId(state, action: { payload: string | null }) {
      state.selectedArtistId = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchArtists.pending, state => { state.loading = true; })
      .addCase(fetchArtists.fulfilled, (state, action) => {
        state.loading = false;
        state.artists = action.payload;
      })
      .addCase(fetchArtists.rejected, state => { state.loading = false; })
      .addCase(fetchFollowedArtists.fulfilled, (state, action) => {
        state.followedArtistIds = action.payload;
      })
      .addCase(followArtist.fulfilled, (state, action) => {
        if (!state.followedArtistIds.includes(action.payload)) {
          state.followedArtistIds.push(action.payload);
        }
        const artist = state.artists.find(a => a.id === action.payload);
        if (artist) artist._count.followers += 1;
      })
      .addCase(unfollowArtist.fulfilled, (state, action) => {
        state.followedArtistIds = state.followedArtistIds.filter(id => id !== action.payload);
        const artist = state.artists.find(a => a.id === action.payload);
        if (artist) artist._count.followers = Math.max(0, artist._count.followers - 1);
      });
  },
});

export const { setSelectedArtistId } = artistSlice.actions;
export default artistSlice.reducer;
