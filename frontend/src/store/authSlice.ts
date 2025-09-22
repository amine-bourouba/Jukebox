import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../services/authService';

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, thunkAPI) => {
    try {
      const response = await authService.login(credentials);
      localStorage.setItem('userId', response.id);
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
      const response = await authService.register(data);
      localStorage.setItem('userId', response.id);
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
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

// Architectural decision: Use userId from Redux or localStorage for refresh
export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, thunkAPI) => {
    const state: any = thunkAPI.getState();
    const userId = state.auth.user?.id || localStorage.getItem('userId');
    const refreshToken = state.auth.refreshToken || localStorage.getItem('refreshToken');
    if (!userId || !refreshToken) throw new Error('Missing userId or refreshToken');
    const response = await authService.refresh(userId, refreshToken);
    console.log("🚀 ~ response:", response)
    // Save new userId if rotated
    localStorage.setItem('userId', response.id || userId);
    return {
      token: response.access_token,
      refreshToken: response.refresh_token || response.refreshToken,
      user: state.auth.user
    };
  }
);

export const fetchUser = createAsyncThunk(
  'auth/fetchUser',
  async (_, thunkAPI) => {
    try {
      const state: any = thunkAPI.getState();
      const token = state.auth.token || localStorage.getItem('token');
      if (!token) throw new Error('No token found');
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
  user: (() => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  })(),
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
      localStorage.removeItem('userId');
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
        localStorage.setItem('userId', action.payload.user.id);
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
        localStorage.setItem('userId', action.payload.user.id);
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
        localStorage.setItem('userId', action.payload.user.id);
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
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;