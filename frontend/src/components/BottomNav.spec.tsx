import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BottomNav from './BottomNav';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
});

function renderNav(path = '/dashboard', search = '') {
  return render(
    <MemoryRouter initialEntries={[`${path}${search}`]}>
      <BottomNav />
    </MemoryRouter>
  );
}

describe('BottomNav', () => {
  it('renders all four nav items', () => {
    renderNav();
    expect(screen.getByLabelText('Library')).toBeInTheDocument();
    expect(screen.getByLabelText('Playlists')).toBeInTheDocument();
    expect(screen.getByLabelText('Artists')).toBeInTheDocument();
    expect(screen.getByLabelText('Settings')).toBeInTheDocument();
  });

  it('highlights Library when on /dashboard with no view param', () => {
    renderNav('/dashboard');
    expect(screen.getByLabelText('Library').className).toContain('text-amethyst');
    expect(screen.getByLabelText('Playlists').className).not.toContain('text-amethyst');
  });

  it('highlights Playlists when view=playlists', () => {
    renderNav('/dashboard', '?view=playlists');
    expect(screen.getByLabelText('Playlists').className).toContain('text-amethyst');
    expect(screen.getByLabelText('Library').className).not.toContain('text-amethyst');
  });

  it('highlights Artists when view=artists', () => {
    renderNav('/dashboard', '?view=artists');
    expect(screen.getByLabelText('Artists').className).toContain('text-amethyst');
    expect(screen.getByLabelText('Library').className).not.toContain('text-amethyst');
  });

  it('highlights Settings when on /settings', () => {
    renderNav('/settings');
    expect(screen.getByLabelText('Settings').className).toContain('text-amethyst');
    expect(screen.getByLabelText('Library').className).not.toContain('text-amethyst');
  });
});
