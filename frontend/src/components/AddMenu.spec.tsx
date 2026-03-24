import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mockShowUploadSong = vi.fn();
const mockShowCreatePlaylist = vi.fn();

vi.mock('./UploadSongModal', () => ({
  useUploadSong: () => ({ showUploadSong: mockShowUploadSong }),
}));

vi.mock('./PlaylistModal', () => ({
  usePlaylistModal: () => ({ showCreatePlaylist: mockShowCreatePlaylist, showEditPlaylist: vi.fn() }),
}));

import AddMenu from './AddMenu';

describe('AddMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the + button', () => {
    render(<AddMenu />);
    expect(screen.getByLabelText('Add new')).toBeInTheDocument();
  });

  it('should not show menu initially', () => {
    render(<AddMenu />);
    expect(screen.queryByText('Upload Song')).not.toBeInTheDocument();
  });

  it('should open menu on + button click', () => {
    render(<AddMenu />);
    fireEvent.click(screen.getByLabelText('Add new'));
    expect(screen.getByText('Upload Song')).toBeInTheDocument();
    expect(screen.getByText('Create Playlist')).toBeInTheDocument();
  });

  it('should close menu on second + button click', () => {
    render(<AddMenu />);
    fireEvent.click(screen.getByLabelText('Add new'));
    expect(screen.getByText('Upload Song')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Add new'));
    expect(screen.queryByText('Upload Song')).not.toBeInTheDocument();
  });

  it('should call showUploadSong when Upload Song is clicked', () => {
    render(<AddMenu />);
    fireEvent.click(screen.getByLabelText('Add new'));
    fireEvent.click(screen.getByText('Upload Song'));

    expect(mockShowUploadSong).toHaveBeenCalledOnce();
  });

  it('should close menu after selecting an item', () => {
    render(<AddMenu />);
    fireEvent.click(screen.getByLabelText('Add new'));
    fireEvent.click(screen.getByText('Upload Song'));

    expect(screen.queryByText('Upload Song')).not.toBeInTheDocument();
  });

  it('should close menu when clicking outside', () => {
    render(<AddMenu />);
    fireEvent.click(screen.getByLabelText('Add new'));
    expect(screen.getByText('Upload Song')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('Upload Song')).not.toBeInTheDocument();
  });

  it('should call showCreatePlaylist when Create Playlist is clicked', () => {
    render(<AddMenu />);
    fireEvent.click(screen.getByLabelText('Add new'));
    fireEvent.click(screen.getByText('Create Playlist'));

    expect(mockShowCreatePlaylist).toHaveBeenCalledOnce();
  });
});
