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
    register: vi.fn((data) => ({
      type: 'auth/register/pending',
      payload: data,
    })),
  };
});

import RegisterForm from './RegisterForm';
import { register } from '../../store/authSlice';

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

function renderRegisterForm(storeOverrides: Partial<import('../../store/types').AuthState> = {}) {
  const store = createStore(storeOverrides);
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/register']}>
        <RegisterForm />
      </MemoryRouter>
    </Provider>
  );
}

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the create account heading', () => {
    renderRegisterForm();
    expect(screen.getByText('Create Account')).toBeInTheDocument();
  });

  it('should render all input fields', () => {
    renderRegisterForm();
    expect(screen.getByPlaceholderText('Display Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('should render link to login page', () => {
    renderRegisterForm();
    const link = screen.getByText('Already have an account? Login');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/login');
  });

  it('should update input values on change', () => {
    renderRegisterForm();
    const nameInput = screen.getByPlaceholderText('Display Name') as HTMLInputElement;
    const emailInput = screen.getByPlaceholderText('Email address') as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: 'Alice' } });
    fireEvent.change(emailInput, { target: { value: 'alice@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'pass123' } });

    expect(nameInput.value).toBe('Alice');
    expect(emailInput.value).toBe('alice@test.com');
    expect(passwordInput.value).toBe('pass123');
  });

  it('should dispatch register on form submit', () => {
    renderRegisterForm();
    fireEvent.change(screen.getByPlaceholderText('Display Name'), {
      target: { value: 'Bob' },
    });
    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'bob@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'secret' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    expect(register).toHaveBeenCalledWith({
      displayName: 'Bob',
      email: 'bob@test.com',
      password: 'secret',
    });
  });

  it('should show "Registering..." when loading', () => {
    renderRegisterForm({ loading: true });
    expect(screen.getByRole('button', { name: 'Registering...' })).toBeDisabled();
  });

  it('should display error message', () => {
    renderRegisterForm({ error: 'Email already exists' });
    expect(screen.getByText('Email already exists')).toBeInTheDocument();
  });

  it('should render subtitle text', () => {
    renderRegisterForm();
    expect(screen.getByText('Sign up to start your music journey')).toBeInTheDocument();
  });
});
