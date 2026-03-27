import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AlbumSection from './AlbumSection';

// SongListItem renders a <tr> — wrap in table/tbody to avoid invalid HTML warnings
vi.mock('./SongListItem', () => ({
  default: ({ playlistSong, onPlay }: any) => (
    <tr
      data-testid={`song-item-${playlistSong.song.id}`}
      onClick={() => onPlay(playlistSong.song)}
    >
      <td>{playlistSong.song.title}</td>
    </tr>
  ),
}));

function makeSong(id: string, title: string, position = 1) {
  return {
    id: `ps-${id}`,
    position,
    addedAt: '2024-01-01',
    song: { id, title, artist: 'Artist', album: 'Album', duration: 200, thumbnail: '' },
  };
}

function renderSection(albumName = 'Test Album', songs = [makeSong('s1', 'Song A')]) {
  const onPlay = vi.fn();
  render(
    <table>
      <tbody>
        <AlbumSection albumName={albumName} songs={songs} onPlay={onPlay} />
      </tbody>
    </table>
  );
  return { onPlay };
}

describe('AlbumSection', () => {
  it('renders the album name', () => {
    renderSection('A Night at the Opera');
    expect(screen.getByText('A Night at the Opera')).toBeInTheDocument();
  });

  it('renders a row for each song', () => {
    const songs = [makeSong('s1', 'Song A', 1), makeSong('s2', 'Song B', 2)];
    renderSection('My Album', songs);
    expect(screen.getByTestId('song-item-s1')).toBeInTheDocument();
    expect(screen.getByTestId('song-item-s2')).toBeInTheDocument();
  });

  it('renders no song rows when songs array is empty', () => {
    renderSection('Empty Album', []);
    expect(screen.queryByTestId(/song-item/)).toBeNull();
  });

  it('calls onPlay with the song data when a song row is clicked', () => {
    const songs = [makeSong('s1', 'Bohemian Rhapsody')];
    const { onPlay } = renderSection('Opera', songs);
    fireEvent.click(screen.getByTestId('song-item-s1'));
    expect(onPlay).toHaveBeenCalledWith(
      expect.objectContaining({ id: 's1', title: 'Bohemian Rhapsody' })
    );
  });

  it('renders the album divider line', () => {
    const { container } = render(
      <table>
        <tbody>
          <AlbumSection albumName="Divider Test" songs={[]} onPlay={vi.fn()} />
        </tbody>
      </table>
    );
    // The horizontal divider is a div with class h-px
    const divider = container.querySelector('.h-px');
    expect(divider).toBeInTheDocument();
  });

  it('renders multiple songs in correct order', () => {
    const songs = [
      makeSong('s1', 'First Song', 1),
      makeSong('s2', 'Second Song', 2),
      makeSong('s3', 'Third Song', 3),
    ];
    renderSection('Ordered Album', songs);
    const items = screen.getAllByTestId(/song-item/);
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveAttribute('data-testid', 'song-item-s1');
    expect(items[1]).toHaveAttribute('data-testid', 'song-item-s2');
    expect(items[2]).toHaveAttribute('data-testid', 'song-item-s3');
  });
});
