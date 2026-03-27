import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AlbumCard from './AlbumCard';

describe('AlbumCard', () => {
  it('renders the album name', () => {
    render(<AlbumCard albumName="Hybrid Theory" songCount={12} onClick={vi.fn()} />);
    expect(screen.getByText('Hybrid Theory')).toBeInTheDocument();
  });

  it('shows correct plural song count', () => {
    render(<AlbumCard albumName="X" songCount={5} onClick={vi.fn()} />);
    expect(screen.getByText('5 songs • Album')).toBeInTheDocument();
  });

  it('shows singular "song" when count is 1', () => {
    render(<AlbumCard albumName="Single" songCount={1} onClick={vi.fn()} />);
    expect(screen.getByText('1 song • Album')).toBeInTheDocument();
  });

  it('renders cover image when coverUrl is provided', () => {
    render(<AlbumCard albumName="X" songCount={3} coverUrl="/cover.jpg" onClick={vi.fn()} />);
    const img = document.querySelector('img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.src).toContain('/cover.jpg');
    expect(img.alt).toBe('X');
  });

  it('renders placeholder icon when no coverUrl', () => {
    render(<AlbumCard albumName="X" songCount={3} onClick={vi.fn()} />);
    expect(document.querySelector('img')).toBeNull();
  });

  it('calls onClick when the card is clicked', () => {
    const onClick = vi.fn();
    render(<AlbumCard albumName="X" songCount={3} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
