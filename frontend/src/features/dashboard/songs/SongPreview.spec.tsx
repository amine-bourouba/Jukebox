import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SongPreview from './SongPreview';

describe('SongPreview', () => {
  const track = {
    id: 's1',
    title: 'Stairway to Heaven',
    artist: 'Led Zeppelin',
    album: 'Led Zeppelin IV',
  };

  it('should render the song title', () => {
    render(<SongPreview currentTrack={track} />);
    expect(screen.getByText('Stairway to Heaven')).toBeInTheDocument();
  });

  it('should render the artist name', () => {
    render(<SongPreview currentTrack={track} />);
    expect(screen.getByText('Led Zeppelin')).toBeInTheDocument();
  });

  it('should render the album name', () => {
    render(<SongPreview currentTrack={track} />);
    expect(screen.getByText('Led Zeppelin IV')).toBeInTheDocument();
  });

  it('should render the music note icon placeholder', () => {
    const { container } = render(<SongPreview currentTrack={track} />);
    // MdMusicNote renders an SVG
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('should handle missing album gracefully', () => {
    const trackNoAlbum = { id: 's2', title: 'Song', artist: 'Artist', album: '' };
    render(<SongPreview currentTrack={trackNoAlbum} />);
    expect(screen.getByText('Song')).toBeInTheDocument();
    expect(screen.getByText('Artist')).toBeInTheDocument();
  });
});
