import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/authSlice';
import ProtectedRoute from './ProtectedRoute';

function createStore(token: string | null) {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: { user: null, token, refreshToken: null, loading: false, error: null },
    },
  });
}

function renderRoute(token: string | null) {
  const store = createStore(token);
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Secret Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

describe('ProtectedRoute', () => {
  it('should render child route when token exists', () => {
    renderRoute('valid-jwt');
    expect(screen.getByText('Secret Content')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('should redirect to /login when no token', () => {
    renderRoute(null);
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
  });
});
