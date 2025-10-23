// Song types
export type FilterType = 'artist' | 'genre';

export interface SongState {
  filterOptions: Record<FilterType, any[]>;
  filter: { type: string; value: string };
  songs: any[];
}

// Player types
export type Track = {
  id: string;
  title: string;
  artist: string;
  streamUrl: string;
};

export type PlayerState = {
  currentTrack: Track | null;
  queue: Track[];
  repeat: 'off' | 'one' | 'all';
  shuffle: boolean;
  playlists?: any[];
  selectedPlaylistId: string | null;
  selectedPlaylist: null;
};

// Auth types
export interface AuthUser {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}