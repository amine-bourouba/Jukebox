import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PageWrapper from './PageWrapper';

describe('PageWrapper', () => {
  it('should render children', () => {
    render(
      <PageWrapper>
        <h1>Test Content</h1>
      </PageWrapper>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render a wrapper div with gradient background', () => {
    const { container } = render(
      <PageWrapper>
        <span>Hello</span>
      </PageWrapper>
    );
    const outer = container.firstElementChild as HTMLElement;
    expect(outer.className).toContain('min-h-screen');
    expect(outer.className).toContain('bg-gradient-to-br');
  });

  it('should render an inner card container', () => {
    const { container } = render(
      <PageWrapper>
        <span>Content</span>
      </PageWrapper>
    );
    const innerCard = container.querySelector('.rounded-3xl');
    expect(innerCard).toBeTruthy();
    expect(innerCard!.className).toContain('bg-midnight');
  });
});
