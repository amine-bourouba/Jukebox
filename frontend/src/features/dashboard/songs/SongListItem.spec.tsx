import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SongListItem from './SongListItem';

// Mock context menu hook
vi.mock('../../../components/ContextMenu/useContextMenu', () => ({
  useContextMenu: () => ({
    showContextMenu: vi.fn(),
    showContextMenuAt: vi.fn(),
  }),
}));

const mockPlaylistSong = {
  id: 'ps1',
  position: 3,
  addedAt: '2024-06-15T10:30:00Z',
  song: {
    id: 's1',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    album: 'A Night at the Opera',
    duration: 354,
    thumbnail: '/images/queen.jpg',
  },
};

function renderItem(props: Partial<Parameters<typeof SongListItem>[0]> = {}) {
  const defaultProps = {
    playlistSong: mockPlaylistSong,
    onPlay: vi.fn(),
    onMenuClick: vi.fn(),
    ...props,
  };

  return render(
    <table>
      <tbody>
        <SongListItem {...defaultProps} />
      </tbody>
    </table>
  );
}

describe('SongListItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render song title and artist', () => {
    renderItem();
    expect(screen.getByText('Bohemian Rhapsody')).toBeInTheDocument();
    expect(screen.getByText('Queen')).toBeInTheDocument();
  });

  it('should render album name', () => {
    renderItem();
    expect(screen.getByText('A Night at the Opera')).toBeInTheDocument();
  });

  it('should render position number', () => {
    renderItem();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should render formatted date', () => {
    renderItem();
    expect(screen.getByText('2024-06-15')).toBeInTheDocument();
  });

  it('should render formatted duration (mm:ss)', () => {
    renderItem();
    // 354 seconds = 05:54
    expect(screen.getByText('05:54')).toBeInTheDocument();
  });

  it('should render duration with hours when > 3600', () => {
    const longSong = {
      ...mockPlaylistSong,
      song: { ...mockPlaylistSong.song, duration: 3661 },
    };
    renderItem({ playlistSong: longSong });
    // 3661 seconds = 01:01:01
    expect(screen.getByText('01:01:01')).toBeInTheDocument();
  });

  it('should render thumbnail image', () => {
    renderItem();
    const img = screen.getByAltText('Bohemian Rhapsody thumbnail');
    expect(img).toBeInTheDocument();
    expect((img as HTMLImageElement).src).toContain('/images/queen.jpg');
  });

  it('should call onPlay with the song when row is clicked', () => {
    const onPlay = vi.fn();
    renderItem({ onPlay });
    fireEvent.click(screen.getByText('Bohemian Rhapsody').closest('tr')!);
    expect(onPlay).toHaveBeenCalledWith(mockPlaylistSong.song);
  });

  it('should show menu button on hover', () => {
    renderItem();
    const row = screen.getByText('Bohemian Rhapsody').closest('tr')!;
    fireEvent.mouseEnter(row);

    const menuBtn = screen.getByLabelText('More options');
    expect(menuBtn).toBeInTheDocument();
    // Should be visible (opacity-100)
    expect(menuBtn.className).toContain('opacity-100');
  });

  it('should hide menu button when not hovered', () => {
    renderItem();
    const menuBtn = screen.getByLabelText('More options');
    // Initially not hovered → opacity-0
    expect(menuBtn.className).toContain('opacity-0');
  });
});
