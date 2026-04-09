import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import artistReducer from '../../../store/artistSlice';
import ArtistHeader from './ArtistHeader';

function makeStore(followedIds: string[] = []) {
  return configureStore({
    reducer: { artists: artistReducer },
    preloadedState: {
      artists: {
        artists: [],
        selectedArtistId: null,
        followedArtistIds: followedIds,
        loading: false,
      },
    },
  });
}

const defaultArtist = { id: 'a1', name: 'Queen', _count: { songs: 12, followers: 4 } };

function renderHero(overrides: Partial<Parameters<typeof ArtistHeader>[0]> = {}, followedIds: string[] = []) {
  const store = makeStore(followedIds);
  const props = {
    artist: defaultArtist,
    songCount: 12,
    onPlay: vi.fn(),
    onShuffle: vi.fn(),
    ...overrides,
  };
  return {
    store,
    props,
    ...render(<Provider store={store}><ArtistHeader {...props} /></Provider>),
  };
}

describe('ArtistHero', () => {
  it('renders the artist name', () => {
    renderHero({ artist: { ...defaultArtist, name: 'Radiohead' } });
    expect(screen.getByText('Radiohead')).toBeInTheDocument();
  });

  it('renders the "Artist" label', () => {
    renderHero();
    expect(screen.getByText('Artist')).toBeInTheDocument();
  });

  it('renders song count as plural when count > 1', () => {
    renderHero({ songCount: 5 });
    expect(screen.getByText(/5 songs/)).toBeInTheDocument();
  });

  it('renders song count as singular when count is 1', () => {
    renderHero({ songCount: 1 });
    expect(screen.getByText(/1 song/)).toBeInTheDocument();
  });

  it('renders song count as plural when count is 0', () => {
    renderHero({ songCount: 0 });
    expect(screen.getByText(/0 songs/)).toBeInTheDocument();
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

  it('shows Follow button when artist is not followed', () => {
    renderHero();
    expect(screen.getByRole('button', { name: 'Follow artist' })).toBeInTheDocument();
    expect(screen.getByText('Follow')).toBeInTheDocument();
  });

  it('shows Following button when artist is already followed', () => {
    renderHero({}, ['a1']);
    expect(screen.getByText('Following')).toBeInTheDocument();
  });

  it('shows follower count when > 0', () => {
    renderHero({ artist: { ...defaultArtist, _count: { songs: 5, followers: 42 } } });
    expect(screen.getByText(/42 followers/)).toBeInTheDocument();
  });

  it('hides follower count when 0', () => {
    renderHero({ artist: { ...defaultArtist, _count: { songs: 5, followers: 0 } } });
    expect(screen.queryByText(/follower/)).not.toBeInTheDocument();
  });

  it('shows placeholder icon when artist has no imageUrl', () => {
    renderHero({ artist: { ...defaultArtist, imageUrl: undefined } });
    expect(document.querySelector('img')).toBeNull();
  });

  it('renders artist image when imageUrl is set', () => {
    renderHero({ artist: { ...defaultArtist, imageUrl: '/artist.jpg' } });
    const img = document.querySelector('img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.src).toContain('/artist.jpg');
  });

  it('disables play button when songCount is 0', () => {
    renderHero({ songCount: 0 });
    expect(screen.getByRole('button', { name: 'Play all songs' })).toBeDisabled();
  });

  it('disables shuffle button when songCount is 0', () => {
    renderHero({ songCount: 0 });
    expect(screen.getByRole('button', { name: 'Shuffle songs' })).toBeDisabled();
  });

  it('enables play button when songCount > 0', () => {
    renderHero({ songCount: 3 });
    expect(screen.getByRole('button', { name: 'Play all songs' })).not.toBeDisabled();
  });

  it('does not call onPlay when play button is disabled', () => {
    const { props } = renderHero({ songCount: 0 });
    fireEvent.click(screen.getByRole('button', { name: 'Play all songs' }));
    expect(props.onPlay).not.toHaveBeenCalled();
  });
});
