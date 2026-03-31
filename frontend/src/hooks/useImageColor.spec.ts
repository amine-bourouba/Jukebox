import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useImageColor } from './useImageColor';

// ── Canvas mock ───────────────────────────────────────────────────────────────

type MockPixelRow = [number, number, number, number]; // [r, g, b, a]

let mockPixels: MockPixelRow[] = [];
let canvasGetContextShouldFail = false;

function makeImageData(pixels: MockPixelRow[]) {
  const data = new Uint8ClampedArray(pixels.flatMap(p => p));
  return { data };
}

beforeEach(() => {
  canvasGetContextShouldFail = false;
  mockPixels = [[200, 50, 50, 255]]; // a single vibrant red pixel by default

  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => {
    if (canvasGetContextShouldFail) return null;
    return {
      drawImage: vi.fn(),
      getImageData: vi.fn(() => makeImageData(mockPixels)),
    } as unknown as CanvasRenderingContext2D;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Image mock helpers ────────────────────────────────────────────────────────

function fireImageLoad(img: HTMLImageElement) {
  act(() => { img.dispatchEvent(new Event('load')); });
}

function fireImageError(img: HTMLImageElement) {
  act(() => { img.dispatchEvent(new Event('error')); });
}

function getLastImage(): HTMLImageElement {
  const imgs = document.querySelectorAll('img');
  // The hook uses `new Image()`, not DOM img tags — intercept via the constructor
  // Since jsdom doesn't fire load events automatically, we capture the instance
  // through the setter spy set up below.
  return (useImageColor as any).__lastImage as HTMLImageElement;
}

// Intercept `new Image()` to capture the created instance and allow manual firing
let lastCreatedImage: HTMLImageElement | null = null;
const OriginalImage = globalThis.Image;

beforeEach(() => {
  lastCreatedImage = null;
  globalThis.Image = class extends OriginalImage {
    constructor() {
      super();
      lastCreatedImage = this;
    }
  } as typeof Image;
});

afterEach(() => {
  globalThis.Image = OriginalImage;
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useImageColor', () => {
  it('returns null when no imageUrl is provided', () => {
    const { result } = renderHook(() => useImageColor(null));
    expect(result.current).toBeNull();
  });

  it('returns null when imageUrl is undefined', () => {
    const { result } = renderHook(() => useImageColor(undefined));
    expect(result.current).toBeNull();
  });

  it('returns null while the image is still loading', () => {
    const { result } = renderHook(() => useImageColor('/cover.jpg'));
    // Image created but onload not yet fired
    expect(result.current).toBeNull();
  });

  it('returns a rgb() string after the image loads', () => {
    mockPixels = [[200, 50, 50, 255]]; // vibrant red
    const { result } = renderHook(() => useImageColor('/cover.jpg'));

    expect(lastCreatedImage).not.toBeNull();
    fireImageLoad(lastCreatedImage!);

    expect(result.current).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
  });

  it('sets crossOrigin to anonymous on the image element', () => {
    renderHook(() => useImageColor('/cover.jpg'));
    expect(lastCreatedImage?.crossOrigin).toBe('anonymous');
  });

  it('sets the image src to the provided url', () => {
    renderHook(() => useImageColor('/my-cover.jpg'));
    expect(lastCreatedImage?.src).toContain('/my-cover.jpg');
  });

  it('returns null when the image fails to load', () => {
    const { result } = renderHook(() => useImageColor('/missing.jpg'));
    fireImageError(lastCreatedImage!);
    expect(result.current).toBeNull();
  });

  it('returns null when canvas context is unavailable', () => {
    canvasGetContextShouldFail = true;
    const { result } = renderHook(() => useImageColor('/cover.jpg'));
    fireImageLoad(lastCreatedImage!);
    expect(result.current).toBeNull();
  });

  it('returns null when canvas throws (tainted canvas)', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => {
      return {
        drawImage: vi.fn(),
        getImageData: vi.fn(() => { throw new Error('Tainted canvas'); }),
      } as unknown as CanvasRenderingContext2D;
    });

    const { result } = renderHook(() => useImageColor('/external.jpg'));
    fireImageLoad(lastCreatedImage!);
    expect(result.current).toBeNull();
  });

  it('resets color to null when imageUrl changes to null', () => {
    mockPixels = [[200, 50, 50, 255]];
    const { result, rerender } = renderHook(
      ({ url }: { url: string | null }) => useImageColor(url),
      { initialProps: { url: '/cover.jpg' } }
    );

    fireImageLoad(lastCreatedImage!);
    expect(result.current).not.toBeNull();

    rerender({ url: null });
    expect(result.current).toBeNull();
  });

  it('picks the most vibrant pixel over a grey one', () => {
    // Two pixels: a grey one and a vibrant green
    mockPixels = [
      [100, 100, 100, 255], // grey — low saturation, should lose
      [30, 200, 30, 255],   // vibrant green — should win
    ];

    const { result } = renderHook(() => useImageColor('/cover.jpg'));
    fireImageLoad(lastCreatedImage!);

    // The returned color should reflect the green pixel
    expect(result.current).toBe('rgb(30, 200, 30)');
  });

  it('does not update state after the hook is unmounted', () => {
    const { result, unmount } = renderHook(() => useImageColor('/cover.jpg'));
    unmount();
    // Firing load after unmount should not throw or update
    expect(() => fireImageLoad(lastCreatedImage!)).not.toThrow();
    expect(result.current).toBeNull();
  });
});
