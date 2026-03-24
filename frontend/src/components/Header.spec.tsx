import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/authSlice';
import Header from './Header';

vi.mock('./AddMenu', () => ({
  default: () => <button data-testid="add-menu">+</button>,
}));

function createStore(user: any = null) {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: { user, token: 'jwt', refreshToken: null, loading: false, error: null },
    },
  });
}

describe('Header', () => {
  it('should render the brand text', () => {
    render(
      <Provider store={createStore()}>
        <Header />
      </Provider>
    );
    expect(screen.getByText('JKX')).toBeInTheDocument();
  });

  it('should render the search input', () => {
    render(
      <Provider store={createStore()}>
        <Header />
      </Provider>
    );
    expect(screen.getByPlaceholderText('Search music, artists...')).toBeInTheDocument();
  });

  it('should display user displayName when logged in', () => {
    const user = { id: 'u1', displayName: 'Alice', email: 'a@b.com', avatarUrl: '' };
    render(
      <Provider store={createStore(user)}>
        <Header />
      </Provider>
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('should display "User" when no user is present', () => {
    render(
      <Provider store={createStore(null)}>
        <Header />
      </Provider>
    );
    expect(screen.getByText('User')).toBeInTheDocument();
  });

  it('should render avatar with user avatarUrl', () => {
    const user = { id: 'u1', displayName: 'Bob', email: 'b@c.com', avatarUrl: '/bob.png' };
    render(
      <Provider store={createStore(user)}>
        <Header />
      </Provider>
    );
    const avatar = screen.getByAltText('avatar') as HTMLImageElement;
    expect(avatar.src).toContain('/bob.png');
  });

  it('should render default avatar when no avatarUrl', () => {
    const user = { id: 'u1', displayName: 'Bob', email: 'b@c.com' };
    render(
      <Provider store={createStore(user)}>
        <Header />
      </Provider>
    );
    const avatar = screen.getByAltText('avatar') as HTMLImageElement;
    expect(avatar.src).toContain('/default-avatar.png');
  });
});
