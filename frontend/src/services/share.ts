import { snackbar } from './snackbar';

export function shareSongLink(songId: string) {
  const url = `${window.location.origin}/songs/${songId}`;
  navigator.clipboard.writeText(url).then(() => {
    snackbar.show({ message: 'Song link copied to clipboard!', color: 'bg-green-500' });
  });
}

export function sharePlaylistLink(playlistId: string) {
  const url = `${window.location.origin}/playlists/${playlistId}`;
  navigator.clipboard.writeText(url).then(() => {
    snackbar.show({ message: 'Playlist link copied to clipboard!', color: 'bg-green-500' });
  });
}
