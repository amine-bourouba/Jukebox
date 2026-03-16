import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/authSlice';
import playerReducer from '../store/playerSlice';
import songsReducer from '../store/songSlice';
import React from 'react';

// Must mock before importing the hook
vi.mock('../store/authSlice', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    default: actual.default,
    refreshToken: Object.assign(
      vi.fn(() => ({
        type: 'auth/refreshToken/pending',
        unwrap: () => Promise.resolve({ token: 'new', refreshToken: 'new-rt', user: null }),
      })),
      { ...actual.refreshToken }
    ),
    fetchUser: Object.assign(
      vi.fn(() => ({ type: 'auth/fetchUser/pending' })),
      { ...actual.fetchUser }
    ),
  };
});

import useAuthRefresh from './useAuthRefresh';
import { refreshToken, fetchUser } from '../store/authSlice';

function createTestStore(authState: any) {
  return configureStore({
    reducer: {
      auth: authReducer,
      player: playerReducer,
      songs: songsReducer,
    },
    preloadedState: {
      auth: {
        user: null,
        token: null,
        refreshToken: null,
        loading: false,
        error: null,
        ...authState,
      },
    },
  });
}

function createWrapper(store: any) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(Provider, { store }, children);
  };
}

describe('useAuthRefresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should dispatch refreshToken when no token but refreshToken exists', () => {
    const store = createTestStore({ token: null, refreshToken: 'rt-value' });

    renderHook(() => useAuthRefresh(), {
      wrapper: createWrapper(store),
    });

    expect(refreshToken).toHaveBeenCalled();
  });

  it('should dispatch fetchUser when token exists but no user', () => {
    const store = createTestStore({ token: 'jwt', user: null });

    renderHook(() => useAuthRefresh(), {
      wrapper: createWrapper(store),
    });

    expect(fetchUser).toHaveBeenCalled();
  });

  it('should not dispatch anything when both token and user exist', () => {
    const store = createTestStore({
      token: 'jwt',
      user: { id: 'u1', displayName: 'T', email: 'a@b.com' },
    });

    renderHook(() => useAuthRefresh(), {
      wrapper: createWrapper(store),
    });

    expect(refreshToken).not.toHaveBeenCalled();
    expect(fetchUser).not.toHaveBeenCalled();
  });

  it('should not dispatch anything when no token and no refreshToken', () => {
    const store = createTestStore({ token: null, refreshToken: null });

    renderHook(() => useAuthRefresh(), {
      wrapper: createWrapper(store),
    });

    expect(refreshToken).not.toHaveBeenCalled();
    expect(fetchUser).not.toHaveBeenCalled();
  });
});
