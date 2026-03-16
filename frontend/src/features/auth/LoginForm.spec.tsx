import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import authReducer from '../../store/authSlice';

vi.mock('../../store/authSlice', async () => {
  const actual = await vi.importActual<typeof import('../../store/authSlice')>('../../store/authSlice');
  return {
    ...actual,
    default: actual.default,
    login: vi.fn((credentials) => ({
      type: 'auth/login/pending',
      payload: credentials,
    })),
  };
});

import LoginForm from './LoginForm';
import { login } from '../../store/authSlice';

function createStore(overrides: Partial<import('../../store/types').AuthState> = {}) {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        user: null,
        token: null,
        refreshToken: null,
        loading: false,
        error: null,
        ...overrides,
      },
    },
  });
}

function renderLoginForm(storeOverrides: Partial<import('../../store/types').AuthState> = {}) {
  const store = createStore(storeOverrides);
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/login']}>
        <LoginForm />
      </MemoryRouter>
    </Provider>
  );
}

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the sign-in heading', () => {
    renderLoginForm();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('should render email and password inputs', () => {
    renderLoginForm();
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('should render the login button', () => {
    renderLoginForm();
    expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument();
  });

  it('should render link to register page', () => {
    renderLoginForm();
    const link = screen.getByText("Don't have an account? Register");
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/register');
  });

  it('should update input values on change', () => {
    renderLoginForm();
    const emailInput = screen.getByPlaceholderText('Email address') as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'secret123' } });

    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('secret123');
  });

  it('should dispatch login on form submit', () => {
    renderLoginForm();
    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'user@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'pass' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Log In' }));

    expect(login).toHaveBeenCalledWith({ email: 'user@test.com', password: 'pass' });
  });

  it('should show "Logging in..." when loading', () => {
    renderLoginForm({ loading: true });
    expect(screen.getByRole('button', { name: 'Logging in...' })).toBeDisabled();
  });

  it('should display error message', () => {
    renderLoginForm({ error: 'Invalid credentials' });
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });
});
