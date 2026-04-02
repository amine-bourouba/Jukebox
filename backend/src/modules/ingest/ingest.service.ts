import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { readdir, stat, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, extname, basename } from 'path';

import { SongsService } from '../songs/songs.service';
import { AcoustIdService } from '../songs/acoustid.service';
import { ArtistsService } from '../artists/artists.service';
import { AlbumsService } from '../albums/albums.service';

const AUDIO_EXTENSIONS = new Set(['.mp3', '.flac', '.wav', '.aac', '.ogg', '.wma', '.m4a']);

function parseFilename(original: string): { title: string; artist: string } {
  const base = original.replace(/\.[^/.]+$/, '');
  const match = base.match(/^(.+?)\s+-\s+(.+)$/);
  if (match) {
    const artist = match[1].trim();
    const title = match[2]
      .replace(/\s*[\[(](?:Official|Audio|Music Video|Lyric Video|HD|4K|HQ|Remaster)[^\])]*[\])]?/gi, '')
      .replace(/[\[(\])].*$/, '')
      .trim();
    return { artist, title: title || match[2].trim() };
  }
  return { title: base, artist: '' };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

@Injectable()
export class IngestService implements OnModuleInit {
  private readonly logger = new Logger(IngestService.name);
  private isRunning = false;

  private readonly watchDir = process.env.INGEST_WATCH_DIR ?? 'uploads/songs';
  private readonly minAgeSeconds = Number(process.env.INGEST_MIN_AGE_SECONDS ?? 30);
  private readonly acoustidDelayMs = Number(process.env.INGEST_ACOUSTID_DELAY_MS ?? 400);
  private readonly intervalMinutes = Number(process.env.INGEST_INTERVAL_MINUTES ?? 2);

  constructor(
    private readonly songsService: SongsService,
    private readonly acoustIdService: AcoustIdService,
    private readonly artistsService: ArtistsService,
    private readonly albumsService: AlbumsService,
  ) {}

  onModuleInit() {
    if (!process.env.INGEST_USER_ID) {
      this.logger.warn(
        'INGEST_USER_ID is not set — periodic ingest is disabled. ' +
        'Set this env var to the admin user ID to enable automatic file ingestion.',
      );
    }
  }

  @Cron(`0 */${process.env.INGEST_INTERVAL_MINUTES ?? 2} * * * *`)
  async runScan(): Promise<void> {
    const userId = process.env.INGEST_USER_ID;
    if (!userId) return;

    if (this.isRunning) {
      this.logger.warn('Ingest scan already in progress — skipping this tick');
      return;
    }

    this.isRunning = true;
    try {
      await this._scan(userId);
    } finally {
      this.isRunning = false;
    }
  }

  private async _scan(userId: string): Promise<void> {
    const absWatchDir = join(process.cwd(), this.watchDir);

    if (!existsSync(absWatchDir)) {
      this.logger.warn(`Watch directory does not exist: ${absWatchDir}`);
      return;
    }

    let entries: string[];
    try {
      entries = await readdir(absWatchDir);
    } catch (err: any) {
      this.logger.error(`Failed to read watch directory: ${err.message}`);
      return;
    }

    const audioFiles = entries.filter(f => AUDIO_EXTENSIONS.has(extname(f).toLowerCase()));

    if (audioFiles.length === 0) return;

    this.logger.log(`Ingest scan: ${audioFiles.length} audio file(s) found in ${this.watchDir}`);

    let newCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const filename of audioFiles) {
      const absPath = join(absWatchDir, filename);
      const relPath = `${this.watchDir}/${filename}`.replace(/\\/g, '/');

      try {
        // Guard 1: file age
        const fileStat = await stat(absPath);
        const ageSeconds = (Date.now() - fileStat.mtimeMs) / 1000;
        if (ageSeconds < this.minAgeSeconds) {
          skippedCount++;
          continue;
        }

        // Guard 2: file size stability (mid-copy check)
        const sizeBefore = fileStat.size;
        await sleep(1000);
        const sizeAfter = (await stat(absPath)).size;
        if (sizeBefore !== sizeAfter) {
          this.logger.warn(`Skipping ${filename} — file size is still changing (mid-copy)`);
          skippedCount++;
          continue;
        }

        // Guard 3: deduplication
        const existing = await this.songsService.findByFilePath(relPath);
        if (existing) {
          skippedCount++;
          continue;
        }

        await this.ingestFile(userId, absPath, relPath, filename);
        newCount++;
      } catch (err: any) {
        this.logger.error(`Failed to ingest "${filename}": ${err.message}`);
        failedCount++;
      }
    }

    this.logger.log(
      `Ingest scan complete — new: ${newCount}, skipped: ${skippedCount}, failed: ${failedCount}`,
    );
  }

  private async ingestFile(
    userId: string,
    absPath: string,
    relPath: string,
    filename: string,
  ): Promise<void> {
    const { parseFile } = await import('music-metadata');

    // Guard 4: ID3 tags
    let metadata: any = null;
    try {
      metadata = await parseFile(absPath);
    } catch { /* no-op — fall through to filename parse */ }

    let tagTitle: string = metadata?.common.title ?? '';
    let tagArtist: string = '';
    if (metadata) {
      if (Array.isArray(metadata.common.artists) && metadata.common.artists.length > 0) {
        tagArtist = metadata.common.artists[0];
      } else if (metadata.common.artist) {
        tagArtist = metadata.common.artist;
      }
    }
    const tagAlbum: string = metadata?.common.album ?? '';
    const tagDuration: number | undefined = metadata?.format.duration
      ? Math.round(metadata.format.duration)
      : undefined;

    // Guard 5: embedded cover art
    let coverRelPath: string | undefined;
    const picture = metadata?.common.picture?.[0];
    if (picture) {
      try {
        const coverFilename = `${basename(filename, extname(filename))}-cover.jpg`;
        const coverAbsPath = join(process.cwd(), 'uploads', 'thumbnails', coverFilename);
        await writeFile(coverAbsPath, picture.data);
        coverRelPath = `uploads/thumbnails/${coverFilename}`;
      } catch (err: any) {
        this.logger.warn(`Could not extract cover art from "${filename}": ${err.message}`);
      }
    }

    // Guard 6: AcoustID only if both title AND artist are missing from ID3
    let acData: { title?: string; artist?: string; album?: string; duration?: number } | null = null;
    if (!tagTitle && !tagArtist) {
      acData = await this.acoustIdService.lookup(absPath);
      await sleep(this.acoustidDelayMs);
    }

    // Guard 7: filename fallback
    const parsed = parseFilename(filename);

    const finalTitle = acData?.title || tagTitle || parsed.title;
    const finalArtist = acData?.artist || tagArtist || parsed.artist;
    const finalAlbum = acData?.album || tagAlbum || undefined;
    const finalDuration = acData?.duration ?? tagDuration;

    const songData: any = {
      title: finalTitle,
      artist: finalArtist,
      album: finalAlbum,
      duration: finalDuration,
    };

    // Guard 8a: auto-link Artist
    if (finalArtist) {
      songData.artistId = await this.artistsService.findOrCreate(userId, finalArtist);
    }

    // Guard 8b: auto-link Album
    if (songData.artistId && finalAlbum) {
      songData.albumId = await this.albumsService.findOrCreate(
        songData.artistId,
        finalAlbum,
        coverRelPath,
      );
    }

    await this.songsService.createSongWithUpload(
      userId,
      songData,
      relPath,
      coverRelPath,
    );

    this.logger.log(`Ingested: "${finalTitle}" by "${finalArtist || 'Unknown'}" (${filename})`);
  }
}
