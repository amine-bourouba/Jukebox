import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./snackbar', () => ({
  snackbar: { show: vi.fn() },
}));

import { shareSongLink, sharePlaylistLink } from './share';
import { snackbar } from './snackbar';

describe('share utilities', () => {
  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
  });

  it('shareSongLink should copy song URL to clipboard and show snackbar', async () => {
    shareSongLink('s1');

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('/songs/s1'));
    await vi.waitFor(() => {
      expect(snackbar.show).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Song link copied to clipboard!' })
      );
    });
  });

  it('sharePlaylistLink should copy playlist URL to clipboard and show snackbar', async () => {
    sharePlaylistLink('p1');

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('/playlists/p1'));
    await vi.waitFor(() => {
      expect(snackbar.show).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Playlist link copied to clipboard!' })
      );
    });
  });
});
