import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ViewToggle from './ViewToggle';

describe('ViewToggle', () => {
  const onChange = vi.fn();

  beforeEach(() => onChange.mockClear());

  it('renders list and grid buttons', () => {
    render(<ViewToggle mode="list" onChange={onChange} />);
    expect(screen.getByLabelText('List view')).toBeInTheDocument();
    expect(screen.getByLabelText('Grid view')).toBeInTheDocument();
  });

  it('highlights list button when mode is list', () => {
    render(<ViewToggle mode="list" onChange={onChange} />);
    expect(screen.getByLabelText('List view').className).toContain('bg-amethyst');
    expect(screen.getByLabelText('Grid view').className).not.toContain('bg-amethyst');
  });

  it('highlights grid button when mode is grid', () => {
    render(<ViewToggle mode="grid" onChange={onChange} />);
    expect(screen.getByLabelText('Grid view').className).toContain('bg-amethyst');
    expect(screen.getByLabelText('List view').className).not.toContain('bg-amethyst');
  });

  it('calls onChange with "grid" when grid button is clicked', () => {
    render(<ViewToggle mode="list" onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Grid view'));
    expect(onChange).toHaveBeenCalledWith('grid');
  });

  it('calls onChange with "list" when list button is clicked', () => {
    render(<ViewToggle mode="grid" onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('List view'));
    expect(onChange).toHaveBeenCalledWith('list');
  });
});
