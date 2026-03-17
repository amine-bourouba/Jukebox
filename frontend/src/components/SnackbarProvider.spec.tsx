import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { SnackbarProvider, useSnackbar } from './SnackbarProvider';

// Mock the snackbar service so register is captured
vi.mock('../services/snackbar', () => ({
  snackbar: {
    register: vi.fn(),
  },
}));

import { snackbar } from '../services/snackbar';

function Trigger() {
  const { showSnackbar } = useSnackbar();
  return (
    <button
      onClick={() => showSnackbar({ message: 'Item saved!', color: 'bg-green-500' })}
    >
      Show
    </button>
  );
}

function renderWithProvider() {
  return render(
    <SnackbarProvider>
      <Trigger />
    </SnackbarProvider>
  );
}

describe('SnackbarProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should register showSnackbar with the snackbar service on mount', () => {
    renderWithProvider();
    expect(snackbar.register).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should not show snackbar initially', () => {
    renderWithProvider();
    expect(screen.queryByText('Item saved!')).not.toBeInTheDocument();
  });

  it('should show snackbar message when triggered', () => {
    renderWithProvider();
    act(() => {
      screen.getByText('Show').click();
    });
    expect(screen.getByText('Item saved!')).toBeInTheDocument();
  });

  it('should apply the color class', () => {
    renderWithProvider();
    act(() => {
      screen.getByText('Show').click();
    });
    const snackbarEl = screen.getByText('Item saved!').closest('div');
    expect(snackbarEl!.className).toContain('bg-green-500');
  });

  it('should auto-dismiss after 2 seconds', () => {
    renderWithProvider();
    act(() => {
      screen.getByText('Show').click();
    });
    expect(screen.getByText('Item saved!')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByText('Item saved!')).not.toBeInTheDocument();
  });

  it('should throw if useSnackbar is used outside provider', () => {
    function Bad() {
      useSnackbar();
      return null;
    }
    expect(() => render(<Bad />)).toThrow(
      'useSnackbar must be used within a SnackbarProvider'
    );
  });
});
