import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ConfirmationModalProvider, useConfirmation } from './ConfirmationModal';

// Helper component that triggers the modal
function Trigger() {
  const { showConfirmation } = useConfirmation();

  const handleClick = async () => {
    const result = await showConfirmation({
      title: 'Delete Item',
      content: 'Are you sure you want to delete this?',
    });
    // Store result in a data attribute so tests can read it
    document.getElementById('result')!.dataset.value = String(result);
  };

  return (
    <>
      <button onClick={handleClick}>Open Modal</button>
      <span id="result" />
    </>
  );
}

function renderWithProvider() {
  return render(
    <ConfirmationModalProvider>
      <Trigger />
    </ConfirmationModalProvider>
  );
}

describe('ConfirmationModal', () => {
  it('should not show modal initially', () => {
    renderWithProvider();
    expect(screen.queryByText('Delete Item')).not.toBeInTheDocument();
  });

  it('should show modal with title and content when triggered', async () => {
    renderWithProvider();
    await act(() => fireEvent.click(screen.getByText('Open Modal')));

    expect(screen.getByText('Delete Item')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this?')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should resolve with true when Confirm is clicked', async () => {
    renderWithProvider();
    await act(() => fireEvent.click(screen.getByText('Open Modal')));
    await act(() => fireEvent.click(screen.getByText('Confirm')));

    expect(screen.queryByText('Delete Item')).not.toBeInTheDocument();
    expect(document.getElementById('result')!.dataset.value).toBe('true');
  });

  it('should resolve with false when Cancel is clicked', async () => {
    renderWithProvider();
    await act(() => fireEvent.click(screen.getByText('Open Modal')));
    await act(() => fireEvent.click(screen.getByText('Cancel')));

    expect(screen.queryByText('Delete Item')).not.toBeInTheDocument();
    expect(document.getElementById('result')!.dataset.value).toBe('false');
  });

  it('should resolve with false when backdrop is clicked', async () => {
    renderWithProvider();
    await act(() => fireEvent.click(screen.getByText('Open Modal')));

    // The backdrop is the div with bg-black/60
    const backdrop = document.querySelector('.bg-black\\/60');
    expect(backdrop).toBeTruthy();
    await act(() => fireEvent.click(backdrop!));

    expect(screen.queryByText('Delete Item')).not.toBeInTheDocument();
    expect(document.getElementById('result')!.dataset.value).toBe('false');
  });

  it('should throw if useConfirmation is used outside provider', () => {
    function Bad() {
      useConfirmation();
      return null;
    }
    expect(() => render(<Bad />)).toThrow(
      'useConfirmation must be used within a ConfirmationModalProvider'
    );
  });
});
