import { useState, useEffect } from 'react';

/**
 * Extracts the dominant vibrant color from an image URL using an offscreen canvas.
 * Returns a CSS `rgb(r, g, b)` string, or null when no image is provided or on error.
 *
 * Pixels are scored by saturation weighted against mid-range brightness so that
 * very dark and very washed-out areas are deprioritised — the result is the most
 * "interesting" colour in the image rather than the statistical mean.
 */
export function useImageColor(imageUrl: string | null | undefined): string | null {
  const [color, setColor] = useState<string | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setColor(null);
      return;
    }

    let cancelled = false;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement('canvas');
        const SIZE = 50;
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, SIZE, SIZE);
        const { data } = ctx.getImageData(0, 0, SIZE, SIZE);

        let bestR = 0, bestG = 0, bestB = 0, bestScore = -1;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i] / 255;
          const g = data[i + 1] / 255;
          const b = data[i + 2] / 255;

          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const l = (max + min) / 2;
          const s = max === min
            ? 0
            : l < 0.5
              ? (max - min) / (max + min)
              : (max - min) / (2 - max - min);

          // Favour saturated colours at medium brightness (avoid near-black or near-white)
          const score = s * (1 - Math.abs(l - 0.45));
          if (score > bestScore) {
            bestScore = score;
            bestR = data[i];
            bestG = data[i + 1];
            bestB = data[i + 2];
          }
        }

        if (!cancelled) setColor(`rgb(${bestR}, ${bestG}, ${bestB})`);
      } catch {
        // Canvas tainted (CORS) or unsupported — degrade gracefully
        if (!cancelled) setColor(null);
      }
    };

    img.onerror = () => {
      if (!cancelled) setColor(null);
    };

    img.src = imageUrl;

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  return color;
}
