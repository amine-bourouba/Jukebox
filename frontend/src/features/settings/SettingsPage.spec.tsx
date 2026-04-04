import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../store/authSlice';
import SettingsPage from './SettingsPage';
import api from '../../services/api';

vi.mock('../../services/api', () => ({
  default: {
    put: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('../../services/snackbar', () => ({
  snackbar: { show: vi.fn() },
}));

vi.mock('../../components/Header', () => ({
  default: () => <div data-testid="header" />,
}));

// Header uses Link — MemoryRouter is provided in wrapper

function makeStore(userOverrides = {}) {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        user: { id: 'user-1', displayName: 'Test User', email: 'test@example.com', avatarUrl: '', ...userOverrides },
        token: 'tok',
        refreshToken: 'rtok',
        loading: false,
        error: null,
      },
    },
  });
}

function renderPage(store = makeStore()) {
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    </Provider>
  );
}

describe('SettingsPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders all three sections', () => {
    renderPage();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
    expect(screen.getByText('Preferences')).toBeInTheDocument();
  });

  it('pre-fills display name from store', () => {
    renderPage();
    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
  });

  describe('Profile form', () => {
    it('saves updated display name and dispatches updateUser', async () => {
      (api.put as any).mockResolvedValue({ data: { displayName: 'New Name' } });
      const store = makeStore();
      renderPage(store);

      fireEvent.change(screen.getByDisplayValue('Test User'), { target: { value: 'New Name' } });
      fireEvent.click(screen.getByText('Save profile'));

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith('/users/me', { displayName: 'New Name' });
        expect(store.getState().auth.user?.displayName).toBe('New Name');
      });
    });

    it('shows error snackbar on profile save failure', async () => {
      (api.put as any).mockRejectedValue(new Error('Network'));
      const { snackbar } = await import('../../services/snackbar');
      renderPage();

      fireEvent.click(screen.getByText('Save profile'));

      await waitFor(() => {
        expect(snackbar.show).toHaveBeenCalledWith(
          expect.objectContaining({ color: 'bg-red-500' }),
        );
      });
    });
  });

  describe('Password form', () => {
    it('calls PUT /users/me/password with correct payload', async () => {
      (api.put as any).mockResolvedValue({ data: { message: 'Password updated' } });
      renderPage();

      fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'OldPass1' } });
      fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'NewPass1!' } });
      fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'NewPass1!' } });
      fireEvent.click(screen.getByText('Change password'));

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith('/users/me/password', {
          currentPassword: 'OldPass1',
          newPassword: 'NewPass1!',
        });
      });
    });

    it('shows error when passwords do not match', async () => {
      const { snackbar } = await import('../../services/snackbar');
      renderPage();

      fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'NewPass1!' } });
      fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'Different!' } });
      fireEvent.click(screen.getByText('Change password'));

      await waitFor(() => {
        expect(snackbar.show).toHaveBeenCalledWith(
          expect.objectContaining({ message: 'Passwords do not match' }),
        );
        expect(api.put).not.toHaveBeenCalled();
      });
    });
  });
});
