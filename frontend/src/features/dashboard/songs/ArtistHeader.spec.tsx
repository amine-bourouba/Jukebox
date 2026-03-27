import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ArtistHero from './ArtistHeader';

function renderHero(overrides: Partial<Parameters<typeof ArtistHero>[0]> = {}) {
  const props = {
    artistName: 'Queen',
    songCount: 12,
    onPlay: vi.fn(),
    onShuffle: vi.fn(),
    ...overrides,
  };
  return { ...render(<ArtistHero {...props} />), props };
}

describe('ArtistHero', () => {
  it('renders the artist name', () => {
    renderHero({ artistName: 'Radiohead' });
    expect(screen.getByText('Radiohead')).toBeInTheDocument();
  });

  it('renders the "Artist" label', () => {
    renderHero();
    expect(screen.getByText('Artist')).toBeInTheDocument();
  });

  it('renders song count as plural when count > 1', () => {
    renderHero({ songCount: 5 });
    expect(screen.getByText('5 songs')).toBeInTheDocument();
  });

  it('renders song count as singular when count is 1', () => {
    renderHero({ songCount: 1 });
    expect(screen.getByText('1 song')).toBeInTheDocument();
  });

  it('renders song count as plural when count is 0', () => {
    renderHero({ songCount: 0 });
    expect(screen.getByText('0 songs')).toBeInTheDocument();
  });

  it('renders play button with correct aria-label', () => {
    renderHero();
    expect(screen.getByRole('button', { name: 'Play all songs' })).toBeInTheDocument();
  });

  it('renders shuffle button with correct aria-label', () => {
    renderHero();
    expect(screen.getByRole('button', { name: 'Shuffle songs' })).toBeInTheDocument();
  });

  it('calls onPlay when the play button is clicked', () => {
    const { props } = renderHero();
    fireEvent.click(screen.getByRole('button', { name: 'Play all songs' }));
    expect(props.onPlay).toHaveBeenCalledTimes(1);
  });

  it('calls onShuffle when the shuffle button is clicked', () => {
    const { props } = renderHero();
    fireEvent.click(screen.getByRole('button', { name: 'Shuffle songs' }));
    expect(props.onShuffle).toHaveBeenCalledTimes(1);
  });

  it('does not call onShuffle when play is clicked', () => {
    const { props } = renderHero();
    fireEvent.click(screen.getByRole('button', { name: 'Play all songs' }));
    expect(props.onShuffle).not.toHaveBeenCalled();
  });

  it('does not call onPlay when shuffle is clicked', () => {
    const { props } = renderHero();
    fireEvent.click(screen.getByRole('button', { name: 'Shuffle songs' }));
    expect(props.onPlay).not.toHaveBeenCalled();
  });
});
