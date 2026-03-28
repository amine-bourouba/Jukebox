import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';

const execAsync = promisify(exec);

export interface AcoustIdMetadata {
  title?: string;
  artist?: string;
  album?: string;
  duration?: number;
}

@Injectable()
export class AcoustIdService {
  private readonly logger = new Logger(AcoustIdService.name);
  private readonly apiKey = process.env.ACOUSTID_API_KEY ?? '';
  private readonly apiUrl = 'https://api.acoustid.org/v2/lookup';
  private readonly fpcalc = process.env.FPCALC_PATH ?? 'fpcalc';

  /** Runs fpcalc (Chromaprint) on the file. Returns null if fpcalc is not installed. */
  async fingerprint(filePath: string): Promise<{ fingerprint: string; duration: number } | null> {
    try {
      const { stdout } = await execAsync(`"${this.fpcalc}" -json "${filePath}"`);
      const result = JSON.parse(stdout);
      return {
        fingerprint: result.fingerprint,
        duration: Math.round(result.duration),
      };
    } catch {
      this.logger.warn('fpcalc unavailable or failed — fingerprinting skipped');
      return null;
    }
  }

  /** Full lookup: fingerprint the file then query AcoustID. Returns null on any failure. */
  async lookup(filePath: string): Promise<AcoustIdMetadata | null> {
    if (!this.apiKey) {
      this.logger.warn('ACOUSTID_API_KEY not configured — AcoustID lookup skipped');
      return null;
    }

    const fp = await this.fingerprint(filePath);
    if (!fp) return null;

    try {
      const res = await axios.get(this.apiUrl, {
        params: {
          client: this.apiKey,
          duration: fp.duration,
          fingerprint: fp.fingerprint,
          meta: 'recordings releasegroups',
        },
        timeout: 10_000,
      });

      if (res.data.status !== 'ok' || !res.data.results?.length) return null;

      // Highest-scoring result that has at least one recording
      const result = [...res.data.results]
        .filter((r: any) => r.recordings?.length)
        .sort((a: any, b: any) => b.score - a.score)[0];

      // Reject weak matches — they tend to be cover versions or false positives
      if (!result || result.score < 0.85) return null;

      // Recording with the most complete metadata wins
      const recording = [...result.recordings].sort((a: any, b: any) => {
        const score = (r: any) =>
          (r.title ? 1 : 0) + (r.artists?.length ? 1 : 0) + (r.releasegroups?.length ? 1 : 0);
        return score(b) - score(a);
      })[0];

      // Prefer official studio album release groups
      const releaseGroup =
        recording.releasegroups
          ?.filter((rg: any) => rg.type === 'Album' || !rg.type)
          .find(
            (rg: any) =>
              !['Live', 'Compilation', 'Remix'].some(t => rg.secondarytypes?.includes(t)),
          ) ?? recording.releasegroups?.[0];

      return {
        title: recording.title,
        artist: recording.artists?.[0]?.name,
        album: releaseGroup?.title,
        duration: recording.duration,
      };
    } catch (err: any) {
      this.logger.warn(`AcoustID lookup failed: ${err.message}`);
      return null;
    }
  }
}
