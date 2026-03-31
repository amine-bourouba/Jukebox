import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/authSlice';
import playerReducer from '../store/playerSlice';
import songsReducer from '../store/songSlice';
import artistReducer from '../store/artistSlice';

import App from './app';

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
