import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MenuItem from './MenuItem';

const baseItem = {
  id: 'test-item',
  label: 'Test Item',
  color: 'text-white',
  hoverColor: 'hover:bg-amethyst/20',
};

describe('MenuItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render label text', () => {
    render(<MenuItem item={baseItem} onItemClick={vi.fn()} />);
    expect(screen.getByText('Test Item')).toBeInTheDocument();
  });

  it('should render with icon when provided', () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="icon" className={className}>icon</span>
    );
    render(<MenuItem item={{ ...baseItem, icon: Icon }} onItemClick={vi.fn()} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('should call onItemClick when clicked', () => {
    const onItemClick = vi.fn();
    const item = { ...baseItem, onClick: vi.fn() };
    render(<MenuItem item={item} onItemClick={onItemClick} />);

    fireEvent.click(screen.getByRole('menuitem'));
    expect(onItemClick).toHaveBeenCalledWith(item);
  });

  it('should not call onItemClick when disabled', () => {
    const onItemClick = vi.fn();
    const item = { ...baseItem, disabled: true, onClick: vi.fn() };
    render(<MenuItem item={item} onItemClick={onItemClick} />);

    fireEvent.click(screen.getByRole('menuitem'));
    expect(onItemClick).not.toHaveBeenCalled();
  });

  it('should render separator when separator is true and label is empty', () => {
    const { container } = render(
      <MenuItem item={{ id: 'sep', label: '', separator: true }} onItemClick={vi.fn()} />
    );
    expect(container.querySelector('.border-t')).toBeTruthy();
  });

  it('should render a separator line after item when separator and label both present', () => {
    const { container } = render(
      <MenuItem item={{ ...baseItem, separator: true }} onItemClick={vi.fn()} />
    );
    // Should render both the button and a separator line
    expect(screen.getByText('Test Item')).toBeInTheDocument();
    expect(container.querySelector('.border-t')).toBeTruthy();
  });

  it('should render submenu indicator arrow for items with submenu', () => {
    const item = {
      ...baseItem,
      submenu: [{ id: 'sub1', label: 'Sub Item' }],
    };
    render(<MenuItem item={item} onItemClick={vi.fn()} />);

    const button = screen.getByRole('menuitem');
    expect(button).toHaveAttribute('aria-haspopup', 'menu');
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('should toggle submenu open on click', () => {
    const item = {
      ...baseItem,
      submenu: [{ id: 'sub1', label: 'Sub Item' }],
    };
    render(<MenuItem item={item} onItemClick={vi.fn()} />);
    const button = screen.getByRole('menuitem');

    // Closed initially
    expect(screen.queryByText('Sub Item')).not.toBeInTheDocument();

    // Click opens it
    fireEvent.click(button);
    expect(screen.getByText('Sub Item')).toBeInTheDocument();

    // Click again closes it
    fireEvent.click(button);
    expect(screen.queryByText('Sub Item')).not.toBeInTheDocument();
  });

  it('should show submenu on mouse enter', async () => {
    const item = {
      ...baseItem,
      submenu: [{ id: 'sub1', label: 'Sub Item' }],
    };
    render(<MenuItem item={item} onItemClick={vi.fn()} />);

    // Hover to open submenu
    fireEvent.mouseEnter(screen.getByText('Test Item').closest('.relative')!);

    // Submenu should appear
    expect(screen.getByText('Sub Item')).toBeInTheDocument();
  });

  it('should have disabled styles when disabled', () => {
    const item = { ...baseItem, disabled: true };
    render(<MenuItem item={item} onItemClick={vi.fn()} />);

    const button = screen.getByRole('menuitem');
    expect(button).toBeDisabled();
    expect(button.className).toContain('opacity-50');
  });
});
