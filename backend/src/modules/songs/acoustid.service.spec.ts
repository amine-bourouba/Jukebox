import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Test } from '@nestjs/testing';

// ── hoisted mocks (available before any import is evaluated) ─────────────────

// execAsyncImpl becomes the resolved value of promisify(exec) because we attach
// it as exec[promisify.custom] inside the vi.mock factory.
const execAsyncImpl = vi.hoisted(() => vi.fn());
const axiosGetMock = vi.hoisted(() => vi.fn());

vi.mock('child_process', () => {
  const { promisify } = require('util');
  const execFn = vi.fn();
  (execFn as any)[promisify.custom] = execAsyncImpl;
  return { exec: execFn };
});

vi.mock('axios', () => ({
  default: { get: axiosGetMock },
}));

// ── import after mocks are set up ────────────────────────────────────────────

import { AcoustIdService } from './acoustid.service';

// ── helpers ───────────────────────────────────────────────────────────────────

function mockFpcalcSuccess(fingerprint = 'AQAB', duration = 210) {
  execAsyncImpl.mockResolvedValue({ stdout: JSON.stringify({ fingerprint, duration }), stderr: '' });
}

function mockFpcalcFailure() {
  execAsyncImpl.mockRejectedValue(new Error('fpcalc: command not found'));
}

function makeApiResponse(overrides: Record<string, any> = {}) {
  return {
    data: {
      status: 'ok',
      results: [
        {
          score: 0.9,
          recordings: [
            {
              title: 'Bohemian Rhapsody',
              duration: 354,
              artists: [{ name: 'Queen' }],
              releasegroups: [{ title: 'A Night at the Opera', type: 'Album', secondarytypes: [] }],
              ...(overrides.recording ?? {}),
            },
          ],
          ...(overrides.result ?? {}),
        },
      ],
      ...(overrides.data ?? {}),
    },
  };
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('AcoustIdService', () => {
  let service: AcoustIdService;

  beforeEach(async () => {
    process.env.ACOUSTID_API_KEY = 'test-key';
    const module = await Test.createTestingModule({ providers: [AcoustIdService] }).compile();
    service = module.get(AcoustIdService);
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.ACOUSTID_API_KEY;
  });

  // ── fingerprint() ──────────────────────────────────────────────────────────

  describe('fingerprint()', () => {
    it('returns fingerprint and rounded duration on success', async () => {
      mockFpcalcSuccess('TESTFP', 210.7);
      const result = await service.fingerprint('/song.mp3');
      expect(result).toEqual({ fingerprint: 'TESTFP', duration: 211 });
    });

    it('returns null when fpcalc is unavailable', async () => {
      mockFpcalcFailure();
      const result = await service.fingerprint('/song.mp3');
      expect(result).toBeNull();
    });

    it('includes the file path in the fpcalc command', async () => {
      mockFpcalcSuccess();
      await service.fingerprint('/music/track.flac');
      expect(execAsyncImpl).toHaveBeenCalledWith(
        expect.stringContaining('track.flac'),
      );
    });
  });

  // ── lookup() ───────────────────────────────────────────────────────────────

  describe('lookup()', () => {
    it('returns null when ACOUSTID_API_KEY is not set', async () => {
      delete process.env.ACOUSTID_API_KEY;
      const module = await Test.createTestingModule({ providers: [AcoustIdService] }).compile();
      const svc = module.get(AcoustIdService);
      mockFpcalcSuccess();
      const result = await svc.lookup('/song.mp3');
      expect(result).toBeNull();
      expect(axiosGetMock).not.toHaveBeenCalled();
    });

    it('returns null when fingerprinting fails', async () => {
      mockFpcalcFailure();
      const result = await service.lookup('/song.mp3');
      expect(result).toBeNull();
    });

    it('returns null when API status is not ok', async () => {
      mockFpcalcSuccess();
      axiosGetMock.mockResolvedValue({ data: { status: 'error', results: [] } });
      const result = await service.lookup('/song.mp3');
      expect(result).toBeNull();
    });

    it('returns null when results array is empty', async () => {
      mockFpcalcSuccess();
      axiosGetMock.mockResolvedValue({ data: { status: 'ok', results: [] } });
      const result = await service.lookup('/song.mp3');
      expect(result).toBeNull();
    });

    it('returns null when no result has recordings', async () => {
      mockFpcalcSuccess();
      axiosGetMock.mockResolvedValue({
        data: { status: 'ok', results: [{ score: 0.9 }] },
      });
      const result = await service.lookup('/song.mp3');
      expect(result).toBeNull();
    });

    it('returns full metadata from a successful lookup', async () => {
      mockFpcalcSuccess();
      axiosGetMock.mockResolvedValue(makeApiResponse());
      const result = await service.lookup('/song.mp3');
      expect(result).toEqual({
        title: 'Bohemian Rhapsody',
        artist: 'Queen',
        album: 'A Night at the Opera',
        duration: 354,
      });
    });

    it('passes fingerprint and duration to the AcoustID API', async () => {
      mockFpcalcSuccess('MYFP', 180);
      axiosGetMock.mockResolvedValue(makeApiResponse());
      await service.lookup('/song.mp3');
      expect(axiosGetMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({ fingerprint: 'MYFP', duration: 180 }),
        }),
      );
    });

    it('picks the highest-scoring result when multiple exist', async () => {
      mockFpcalcSuccess();
      axiosGetMock.mockResolvedValue({
        data: {
          status: 'ok',
          results: [
            {
              score: 0.5,
              recordings: [{ title: 'Low Score Track', artists: [], releasegroups: [] }],
            },
            {
              score: 0.95,
              recordings: [
                {
                  title: 'High Score Track',
                  duration: 200,
                  artists: [{ name: 'Artist X' }],
                  releasegroups: [{ title: 'Best Album', type: 'Album', secondarytypes: [] }],
                },
              ],
            },
          ],
        },
      });
      const result = await service.lookup('/song.mp3');
      expect(result?.title).toBe('High Score Track');
    });

    it('prefers official Album release group over compilation', async () => {
      mockFpcalcSuccess();
      axiosGetMock.mockResolvedValue({
        data: {
          status: 'ok',
          results: [
            {
              score: 0.9,
              recordings: [
                {
                  title: 'Song',
                  duration: 200,
                  artists: [{ name: 'Artist' }],
                  releasegroups: [
                    { title: 'Greatest Hits', type: 'Album', secondarytypes: ['Compilation'] },
                    { title: 'Studio Album', type: 'Album', secondarytypes: [] },
                  ],
                },
              ],
            },
          ],
        },
      });
      const result = await service.lookup('/song.mp3');
      expect(result?.album).toBe('Studio Album');
    });

    it('returns null on axios error', async () => {
      mockFpcalcSuccess();
      axiosGetMock.mockRejectedValue(new Error('timeout'));
      const result = await service.lookup('/song.mp3');
      expect(result).toBeNull();
    });

    it('handles missing artists array gracefully', async () => {
      mockFpcalcSuccess();
      axiosGetMock.mockResolvedValue({
        data: {
          status: 'ok',
          results: [
            {
              score: 0.9,
              recordings: [{ title: 'No Artist', duration: 180, releasegroups: [] }],
            },
          ],
        },
      });
      const result = await service.lookup('/song.mp3');
      expect(result?.title).toBe('No Artist');
      expect(result?.artist).toBeUndefined();
    });
  });
});
