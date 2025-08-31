import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';
import authService from '../services/authService';

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, thunkAPI) => {
    try {
      const response = await authService.login(credentials);
      return {
        token: response.access_token,
        refreshToken: response.refresh_token || response.refreshToken,
        user: {
          id: response.id,
          displayName: response.displayName,
          email: response.email,
          avatarUrl: response.avatarUrl,
        }
      };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (data: { displayName: string; email: string; password: string }, thunkAPI) => {
    try {
      return await authService.register(data);
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (refreshToken: string) => {
    const res = await api.post('/auth/refresh', { refreshToken });
    // Map backend keys to expected state keys
    return {
      token: res.data.access_token,
      refreshToken: res.data.refresh_token,
      user: res.data.user,
    };
  }
);

export const fetchUser = createAsyncThunk(
  'auth/fetchUser',
  async (_, thunkAPI) => {
    try {
      // Get token from Redux state or localStorage
      const state: any = thunkAPI.getState();
      const token = state.auth.token || localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      // Call backend to get user info
      return await authService.getUser(token);
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Fetch user failed');
    }
  }
);

type AuthUser = {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
} | null;

const initialState = {
  user: null as AuthUser,
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  loading: false,
  error: null as string | null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    },
  },
  extraReducers: builder => {
    builder
      .addCase(login.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('refreshToken', action.payload.refreshToken);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(register.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('refreshToken', action.payload.refreshToken);
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.user = action.payload.user;
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('refreshToken', action.payload.refreshToken);
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.user = action.payload;
        localStorage.setItem('user', JSON.stringify(action.payload));
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.error = action.payload as string;
      })
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;