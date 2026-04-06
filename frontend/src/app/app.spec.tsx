import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { vi, beforeAll } from 'vitest';
import authReducer from '../store/authSlice';
import playerReducer from '../store/playerSlice';
import songsReducer from '../store/songSlice';
import artistReducer from '../store/artistSlice';

import App from './app';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
});

function createTestStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      player: playerReducer,
      songs: songsReducer,
      artists: artistReducer,
    },
  });
}

describe('App', () => {
  it('should render successfully', () => {
    const { baseElement } = render(
      <Provider store={createTestStore()}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    );
    expect(baseElement).toBeTruthy();
  });
});
