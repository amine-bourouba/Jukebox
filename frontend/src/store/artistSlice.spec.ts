import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import artistReducer, {
  fetchArtists,
  fetchFollowedArtists,
  followArtist,
  unfollowArtist,
  setSelectedArtistId,
  type Artist,
} from './artistSlice';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from '../services/api';
const mockApi = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

function makeStore(preloaded?: Partial<{
  artists: Artist[];
  selectedArtistId: string | null;
  followedArtistIds: string[];
  loading: boolean;
}>) {
  return configureStore({
    reducer: { artists: artistReducer },
    preloadedState: {
      artists: {
        artists: [],
        selectedArtistId: null,
        followedArtistIds: [],
        loading: false,
        ...preloaded,
      },
    },
  });
}

const artist1: Artist = { id: 'a1', name: 'Queen', _count: { songs: 12, followers: 4 } };
const artist2: Artist = { id: 'a2', name: 'Radiohead', _count: { songs: 8, followers: 2 } };

describe('artistSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should start with empty arrays and no selection', () => {
      const store = makeStore();
      const state = store.getState().artists;
      expect(state.artists).toEqual([]);
      expect(state.selectedArtistId).toBeNull();
      expect(state.followedArtistIds).toEqual([]);
      expect(state.loading).toBe(false);
    });
  });

  describe('setSelectedArtistId', () => {
    it('should set the selected artist id', () => {
      const store = makeStore({ artists: [artist1] });
      store.dispatch(setSelectedArtistId('a1'));
      expect(store.getState().artists.selectedArtistId).toBe('a1');
    });

    it('should clear the selected artist id when null is passed', () => {
      const store = makeStore({ selectedArtistId: 'a1' });
      store.dispatch(setSelectedArtistId(null));
      expect(store.getState().artists.selectedArtistId).toBeNull();
    });
  });

  describe('fetchArtists thunk', () => {
    it('should set loading during pending', async () => {
      mockApi.get.mockReturnValue(new Promise(() => {})); // never resolves
      const store = makeStore();
      store.dispatch(fetchArtists());
      expect(store.getState().artists.loading).toBe(true);
    });

    it('should populate artists and clear loading on success', async () => {
      mockApi.get.mockResolvedValue({ data: [artist1, artist2] });
      const store = makeStore();
      await store.dispatch(fetchArtists());

      const state = store.getState().artists;
      expect(state.artists).toEqual([artist1, artist2]);
      expect(state.loading).toBe(false);
    });

    it('should clear loading on rejection', async () => {
      mockApi.get.mockRejectedValue(new Error('Network error'));
      const store = makeStore();
      await store.dispatch(fetchArtists());
      expect(store.getState().artists.loading).toBe(false);
    });
  });

  describe('fetchFollowedArtists thunk', () => {
    it('should populate followedArtistIds from API response', async () => {
      mockApi.get.mockResolvedValue({ data: [artist1, artist2] });
      const store = makeStore();
      await store.dispatch(fetchFollowedArtists());

      expect(store.getState().artists.followedArtistIds).toEqual(['a1', 'a2']);
    });

    it('should clear followedArtistIds when API returns empty array', async () => {
      mockApi.get.mockResolvedValue({ data: [] });
      const store = makeStore({ followedArtistIds: ['a1'] });
      await store.dispatch(fetchFollowedArtists());
      expect(store.getState().artists.followedArtistIds).toEqual([]);
    });
  });

  describe('followArtist thunk', () => {
    it('should add artist id to followedArtistIds', async () => {
      mockApi.post.mockResolvedValue({});
      const store = makeStore({ artists: [artist1] });
      await store.dispatch(followArtist('a1'));

      expect(store.getState().artists.followedArtistIds).toContain('a1');
    });

    it('should increment follower count on the artist entity', async () => {
      mockApi.post.mockResolvedValue({});
      const store = makeStore({ artists: [{ ...artist1, _count: { songs: 12, followers: 4 } }] });
      await store.dispatch(followArtist('a1'));

      const updatedArtist = store.getState().artists.artists.find(a => a.id === 'a1')!;
      expect(updatedArtist._count.followers).toBe(5);
    });

    it('should not add duplicate id if already following', async () => {
      mockApi.post.mockResolvedValue({});
      const store = makeStore({ artists: [artist1], followedArtistIds: ['a1'] });
      await store.dispatch(followArtist('a1'));

      expect(store.getState().artists.followedArtistIds.filter(id => id === 'a1')).toHaveLength(1);
    });
  });

  describe('unfollowArtist thunk', () => {
    it('should remove artist id from followedArtistIds', async () => {
      mockApi.delete.mockResolvedValue({});
      const store = makeStore({ artists: [artist1], followedArtistIds: ['a1', 'a2'] });
      await store.dispatch(unfollowArtist('a1'));

      expect(store.getState().artists.followedArtistIds).not.toContain('a1');
      expect(store.getState().artists.followedArtistIds).toContain('a2');
    });

    it('should decrement follower count on the artist entity', async () => {
      mockApi.delete.mockResolvedValue({});
      const store = makeStore({
        artists: [{ ...artist1, _count: { songs: 12, followers: 4 } }],
        followedArtistIds: ['a1'],
      });
      await store.dispatch(unfollowArtist('a1'));

      const updatedArtist = store.getState().artists.artists.find(a => a.id === 'a1')!;
      expect(updatedArtist._count.followers).toBe(3);
    });

    it('should not allow follower count to go below 0', async () => {
      mockApi.delete.mockResolvedValue({});
      const store = makeStore({
        artists: [{ ...artist1, _count: { songs: 12, followers: 0 } }],
        followedArtistIds: ['a1'],
      });
      await store.dispatch(unfollowArtist('a1'));

      const updatedArtist = store.getState().artists.artists.find(a => a.id === 'a1')!;
      expect(updatedArtist._count.followers).toBe(0);
    });
  });
});
