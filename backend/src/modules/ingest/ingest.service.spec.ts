import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';

// ── hoisted mocks ─────────────────────────────────────────────────────────────

const { mockReaddir, mockStat, mockWriteFile, mockExistsSync, mockMusicMetadataParseFile } =
  vi.hoisted(() => ({
    mockReaddir: vi.fn(),
    mockStat: vi.fn(),
    mockWriteFile: vi.fn(),
    mockExistsSync: vi.fn(),
    mockMusicMetadataParseFile: vi.fn(),
  }));

vi.mock('fs/promises', () => ({
  readdir: mockReaddir,
  stat: mockStat,
  writeFile: mockWriteFile,
}));

vi.mock('fs', () => ({
  existsSync: mockExistsSync,
}));

vi.mock('music-metadata', () => ({
  parseFile: mockMusicMetadataParseFile,
}));

// ── helpers ───────────────────────────────────────────────────────────────────

import { IngestService } from './ingest.service';
import { SongsService } from '../songs/songs.service';
import { AcoustIdService } from '../songs/acoustid.service';
import { ArtistsService } from '../artists/artists.service';
import { AlbumsService } from '../albums/albums.service';

function makeMockSongsService() {
  return {
    findByFilePath: vi.fn().mockResolvedValue(null),
    createSongWithUpload: vi.fn().mockResolvedValue({ id: 'song-1' }),
  };
}

function makeMockAcoustIdService() {
  return { lookup: vi.fn().mockResolvedValue(null) };
}

function makeMockArtistsService() {
  return { findOrCreate: vi.fn().mockResolvedValue('artist-1') };
}

function makeMockAlbumsService() {
  return { findOrCreate: vi.fn().mockResolvedValue('album-1') };
}

function makeStatResult(size = 1000, ageMs = 60_000) {
  return { size, mtimeMs: Date.now() - ageMs };
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('IngestService', () => {
  let service: IngestService;
  let songsService: ReturnType<typeof makeMockSongsService>;
  let acoustIdService: ReturnType<typeof makeMockAcoustIdService>;
  let artistsService: ReturnType<typeof makeMockArtistsService>;
  let albumsService: ReturnType<typeof makeMockAlbumsService>;

  beforeEach(async () => {
    process.env.INGEST_USER_ID = 'user-123';
    process.env.INGEST_WATCH_DIR = 'uploads/songs';
    process.env.INGEST_MIN_AGE_SECONDS = '30';
    process.env.INGEST_ACOUSTID_DELAY_MS = '0';
    process.env.INGEST_INTERVAL_MINUTES = '2';

    songsService = makeMockSongsService();
    acoustIdService = makeMockAcoustIdService();
    artistsService = makeMockArtistsService();
    albumsService = makeMockAlbumsService();

    mockExistsSync.mockReturnValue(true);
    mockWriteFile.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestService,
        { provide: SongsService, useValue: songsService },
        { provide: AcoustIdService, useValue: acoustIdService },
        { provide: ArtistsService, useValue: artistsService },
        { provide: AlbumsService, useValue: albumsService },
      ],
    }).compile();

    service = module.get<IngestService>(IngestService);
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.INGEST_USER_ID;
  });

  describe('runScan', () => {
    it('should skip scan when INGEST_USER_ID is not set', async () => {
      delete process.env.INGEST_USER_ID;
      await service.runScan();
      expect(mockReaddir).not.toHaveBeenCalled();
    });

    it('should skip scan when already running', async () => {
      // Simulate concurrent run by triggering two overlapping scans
      mockReaddir.mockResolvedValue([]);
      mockExistsSync.mockReturnValue(true);
      const first = service.runScan();
      const second = service.runScan();
      await Promise.all([first, second]);
      expect(mockReaddir).toHaveBeenCalledTimes(1);
    });

    it('should warn and return when watch dir does not exist', async () => {
      mockExistsSync.mockReturnValue(false);
      await service.runScan();
      expect(mockReaddir).not.toHaveBeenCalled();
    });

    it('should skip non-audio files', async () => {
      mockReaddir.mockResolvedValue(['image.jpg', 'readme.txt', 'song.mp3']);
      mockStat.mockResolvedValue(makeStatResult());
      mockMusicMetadataParseFile.mockResolvedValue({
        common: { title: 'Test', artist: 'Artist', album: '', artists: ['Artist'] },
        format: { duration: 180 },
      });
      await service.runScan();
      expect(songsService.findByFilePath).toHaveBeenCalledTimes(1);
    });

    it('should skip files that are too young', async () => {
      mockReaddir.mockResolvedValue(['new.mp3']);
      mockStat.mockResolvedValue(makeStatResult(1000, 5_000)); // 5 seconds old < 30s min
      await service.runScan();
      expect(songsService.findByFilePath).not.toHaveBeenCalled();
    });

    it('should skip files still being copied (size changed)', async () => {
      mockReaddir.mockResolvedValue(['copying.mp3']);
      mockStat
        .mockResolvedValueOnce(makeStatResult(1000))
        .mockResolvedValueOnce(makeStatResult(2000)); // size changed
      await service.runScan();
      expect(songsService.findByFilePath).not.toHaveBeenCalled();
    });

    it('should skip files already in the database', async () => {
      mockReaddir.mockResolvedValue(['existing.mp3']);
      mockStat.mockResolvedValue(makeStatResult());
      songsService.findByFilePath.mockResolvedValue({ id: 'existing-song' });
      await service.runScan();
      expect(songsService.createSongWithUpload).not.toHaveBeenCalled();
    });

    it('should ingest a new audio file using ID3 tags', async () => {
      mockReaddir.mockResolvedValue(['song.mp3']);
      mockStat.mockResolvedValue(makeStatResult());
      mockMusicMetadataParseFile.mockResolvedValue({
        common: { title: 'My Song', artists: ['My Artist'], album: 'My Album' },
        format: { duration: 200 },
      });

      await service.runScan();

      expect(songsService.createSongWithUpload).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({ title: 'My Song', artist: 'My Artist', album: 'My Album' }),
        'uploads/songs/song.mp3',
        undefined,
      );
    });

    it('should call AcoustID only when both title and artist are missing from ID3', async () => {
      mockReaddir.mockResolvedValue(['unknown.mp3']);
      mockStat.mockResolvedValue(makeStatResult());
      mockMusicMetadataParseFile.mockResolvedValue({
        common: { title: '', artist: '', artists: [] },
        format: { duration: 180 },
      });
      acoustIdService.lookup.mockResolvedValue({ title: 'AC Title', artist: 'AC Artist' });

      await service.runScan();

      expect(acoustIdService.lookup).toHaveBeenCalledTimes(1);
      expect(songsService.createSongWithUpload).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({ title: 'AC Title', artist: 'AC Artist' }),
        expect.any(String),
        undefined,
      );
    });

    it('should NOT call AcoustID when ID3 has title but no artist', async () => {
      mockReaddir.mockResolvedValue(['partial.mp3']);
      mockStat.mockResolvedValue(makeStatResult());
      mockMusicMetadataParseFile.mockResolvedValue({
        common: { title: 'Known Title', artist: '', artists: [] },
        format: { duration: 180 },
      });

      await service.runScan();

      expect(acoustIdService.lookup).not.toHaveBeenCalled();
    });

    it('should fall back to filename parsing when ID3 and AcoustID both fail', async () => {
      mockReaddir.mockResolvedValue(['Artist Name - Song Title.mp3']);
      mockStat.mockResolvedValue(makeStatResult());
      mockMusicMetadataParseFile.mockResolvedValue({
        common: { title: '', artist: '', artists: [] },
        format: {},
      });
      acoustIdService.lookup.mockResolvedValue(null);

      await service.runScan();

      expect(songsService.createSongWithUpload).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({ title: 'Song Title', artist: 'Artist Name' }),
        expect.any(String),
        undefined,
      );
    });

    it('should extract and save embedded cover art', async () => {
      mockReaddir.mockResolvedValue(['song.mp3']);
      mockStat.mockResolvedValue(makeStatResult());
      mockMusicMetadataParseFile.mockResolvedValue({
        common: {
          title: 'Song',
          artists: ['Artist'],
          album: '',
          picture: [{ data: Buffer.from('fake-image'), format: 'image/jpeg' }],
        },
        format: { duration: 180 },
      });

      await service.runScan();

      expect(mockWriteFile).toHaveBeenCalledTimes(1);
      expect(songsService.createSongWithUpload).toHaveBeenCalledWith(
        'user-123',
        expect.any(Object),
        'uploads/songs/song.mp3',
        expect.stringContaining('uploads/thumbnails/'),
      );
    });

    it('should continue processing other files if one fails', async () => {
      mockReaddir.mockResolvedValue(['bad.mp3', 'good.mp3']);
      mockStat.mockResolvedValue(makeStatResult());
      mockMusicMetadataParseFile
        .mockRejectedValueOnce(new Error('parse error'))
        .mockResolvedValueOnce({
          common: { title: 'Good Song', artists: ['Artist'], album: '' },
          format: { duration: 180 },
        });
      // bad.mp3 fails at createSongWithUpload (e.g. DB error), good.mp3 succeeds
      songsService.createSongWithUpload
        .mockRejectedValueOnce(new Error('db error'))
        .mockResolvedValueOnce({ id: 'song-good' });

      await service.runScan();

      // Both files were attempted; good.mp3 succeeded
      expect(songsService.createSongWithUpload).toHaveBeenCalledTimes(2);
    });
  });

  describe('onModuleInit', () => {
    it('should warn when INGEST_USER_ID is not set', () => {
      delete process.env.INGEST_USER_ID;
      // Should not throw
      expect(() => service.onModuleInit()).not.toThrow();
    });
  });
});
