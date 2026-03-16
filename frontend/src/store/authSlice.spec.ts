import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { login, register, refreshToken, fetchUser, logout } from './authSlice';
import authService from '../services/authService';

vi.mock('../services/authService', () => ({
  default: {
    login: vi.fn(),
    register: vi.fn(),
    refresh: vi.fn(),
    getUser: vi.fn(),
  },
}));

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

function createStore(preloadedState?: any) {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: preloadedState ? { auth: preloadedState } : undefined,
  });
}

describe('authSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe('logout reducer', () => {
    it('should clear user, tokens, and localStorage', () => {
      const store = createStore({
        user: { id: 'u1', displayName: 'Test', email: 'a@b.com' },
        token: 'jwt',
        refreshToken: 'rt',
        loading: false,
        error: null,
      });

      store.dispatch(logout());

      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('userId');
    });
  });

  describe('login thunk', () => {
    it('should set user and tokens on success', async () => {
      const response = {
        id: 'u1',
        access_token: 'jwt-token',
        refresh_token: 'refresh-token',
        displayName: 'Test',
        email: 'a@b.com',
        avatarUrl: null,
      };
      (authService.login as any).mockResolvedValue(response);

      const store = createStore({ user: null, token: null, refreshToken: null, loading: false, error: null });
      await store.dispatch(login({ email: 'a@b.com', password: 'pass' }));

      const state = store.getState().auth;
      expect(state.user).toEqual({ id: 'u1', displayName: 'Test', email: 'a@b.com', avatarUrl: null });
      expect(state.token).toBe('jwt-token');
      expect(state.refreshToken).toBe('refresh-token');
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'jwt-token');
    });

    it('should set loading during pending', async () => {
      let resolveLogin: any;
      (authService.login as any).mockImplementation(() => new Promise(r => { resolveLogin = r; }));

      const store = createStore({ user: null, token: null, refreshToken: null, loading: false, error: null });
      const promise = store.dispatch(login({ email: 'a@b.com', password: 'pass' }));

      expect(store.getState().auth.loading).toBe(true);
      resolveLogin({ id: 'u1', access_token: 't', refresh_token: 'r', displayName: 'T', email: 'e' });
      await promise;
    });

    it('should set error on rejection', async () => {
      (authService.login as any).mockRejectedValue({ response: { data: { message: 'Bad creds' } } });

      const store = createStore({ user: null, token: null, refreshToken: null, loading: false, error: null });
      await store.dispatch(login({ email: 'a@b.com', password: 'wrong' }));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Bad creds');
    });
  });

  describe('register thunk', () => {
    it('should set user and tokens on success', async () => {
      const response = {
        id: 'u1',
        access_token: 'jwt',
        refresh_token: 'rt',
        displayName: 'New User',
        email: 'new@b.com',
        avatarUrl: null,
      };
      (authService.register as any).mockResolvedValue(response);

      const store = createStore({ user: null, token: null, refreshToken: null, loading: false, error: null });
      await store.dispatch(register({ displayName: 'New User', email: 'new@b.com', password: 'password123' }));

      const state = store.getState().auth;
      expect(state.user?.email).toBe('new@b.com');
      expect(state.token).toBe('jwt');
      expect(state.loading).toBe(false);
    });

    it('should set error on rejection', async () => {
      (authService.register as any).mockRejectedValue({ response: { data: { message: 'Email taken' } } });

      const store = createStore({ user: null, token: null, refreshToken: null, loading: false, error: null });
      await store.dispatch(register({ displayName: 'X', email: 'x@b.com', password: 'p' }));

      expect(store.getState().auth.error).toBe('Email taken');
    });
  });

  describe('refreshToken thunk', () => {
    it('should update tokens on success', async () => {
      (authService.refresh as any).mockResolvedValue({
        access_token: 'new-jwt',
        refresh_token: 'new-rt',
      });

      const store = createStore({
        user: { id: 'u1', displayName: 'T', email: 'a@b.com' },
        token: 'old-jwt',
        refreshToken: 'old-rt',
        loading: false,
        error: null,
      });
      await store.dispatch(refreshToken());

      const state = store.getState().auth;
      expect(state.token).toBe('new-jwt');
      expect(state.refreshToken).toBe('new-rt');
    });
  });

  describe('fetchUser thunk', () => {
    it('should set user on success', async () => {
      const user = { id: 'u1', displayName: 'Fetched', email: 'a@b.com' };
      (authService.getUser as any).mockResolvedValue(user);

      const store = createStore({ user: null, token: 'jwt', refreshToken: null, loading: false, error: null });
      await store.dispatch(fetchUser());

      expect(store.getState().auth.user).toEqual(user);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(user));
    });

    it('should set error on rejection', async () => {
      (authService.getUser as any).mockRejectedValue({ response: { data: { message: 'Unauthorized' } } });

      const store = createStore({ user: null, token: 'bad', refreshToken: null, loading: false, error: null });
      await store.dispatch(fetchUser());

      expect(store.getState().auth.error).toBe('Unauthorized');
    });
  });
});
