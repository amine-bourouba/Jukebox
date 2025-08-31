import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class MusicBrainzService {
  async searchRecording(title: string, artist: string) {
    const searchUrl = `https://musicbrainz.org/ws/2/recording/?query=recording:"${encodeURIComponent(title)}" AND artist:"${encodeURIComponent(artist)}"&fmt=json&inc=releases+release-groups+artists`;
    const res = await axios.get(searchUrl, {
      headers: { 'User-Agent': 'JukeboxApp/1.0.0 (you@domain.com)' }
    });

    const recordings = res.data.recordings || [];
    if (!recordings.length) throw new BadRequestException('No recordings found');

    // Flatten all releases from all recordings
    const allReleases = recordings.flatMap((rec: any) =>
      (rec.releases || []).map((r: any) => ({
        recording: rec,
        release: r,
        releaseGroup: r['release-group'],
        date: r.date || r['release-events']?.[0]?.date || null,
      }))
    );

    // Filter for official studio albums, exclude compilations, live, bonus, remix
    const filtered = allReleases.filter((r: any) =>
      r.release.status === 'Official' &&
      r.releaseGroup?.['primary-type'] === 'Album' &&
      !['Live', 'Compilation', 'Remix', 'Bonus'].some(type =>
        (r.releaseGroup?.['secondary-types'] || []).includes(type)
      )
    );

    // Prefer releases where the release group title matches the most likely album
    // For generic use, pick the most frequent release group title among filtered
    let best = null;
    if (filtered.length > 0) {
      const titleCounts: Record<string, number> = {};
      filtered.forEach((r: any) => {
        const albumTitle = r.releaseGroup?.title;
        if (albumTitle) {
          titleCounts[albumTitle] = (titleCounts[albumTitle] || 0) + 1;
        }
      });
      const sortedTitles = Object.entries(titleCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([title]) => title);

      // Try to find the earliest release with a "clean" album title
      const avoidWords = ['Anniversary', 'Edition', 'Collection', 'Hits', 'Bonus', 'Remix', 'Live'];
      let preferred = filtered.filter((r: any) =>
        sortedTitles.includes(r.releaseGroup?.title) &&
        !avoidWords.some(word => r.releaseGroup?.title?.toLowerCase().includes(word.toLowerCase()))
      );
      preferred.sort((a: any, b: any) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return a.date.localeCompare(b.date);
      });

      best = preferred[0];
      // If nothing found, fallback to previous logic
      if (!best && filtered.length > 0) {
        filtered.sort((a: any, b: any) => {
          if (!a.date) return 1;
          if (!b.date) return -1;
          return a.date.localeCompare(b.date);
        });
        best = filtered[0];
      }
    }

    // Fallbacks
    if (!best) {
      best = allReleases.find((r: any) =>
        r.release.status === 'Official' &&
        r.releaseGroup?.['primary-type'] === 'Album'
      ) ||
      allReleases.find((r: any) =>
        r.releaseGroup?.['primary-type'] === 'Album'
      ) ||
      allReleases[0];
    }

    return {
      title: best.recording.title,
      artist: best.recording['artist-credit']?.map((a: any) => a.name).join(', '),
      album: best.releaseGroup?.title,
      release: best.release.title,
      date: best.date,
      length: best.recording.length
    };
  }
}