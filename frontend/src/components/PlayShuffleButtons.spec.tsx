import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PlayShuffleButtons from './PlayShuffleButtons';

describe('PlayShuffleButtons', () => {
  const onPlay = vi.fn();
  const onShuffle = vi.fn();

  beforeEach(() => { onPlay.mockClear(); onShuffle.mockClear(); });

  it('renders play and shuffle buttons', () => {
    render(<PlayShuffleButtons onPlay={onPlay} onShuffle={onShuffle} />);
    expect(screen.getByLabelText('Play all')).toBeInTheDocument();
    expect(screen.getByLabelText('Shuffle')).toBeInTheDocument();
  });

  it('calls onPlay when play button is clicked', () => {
    render(<PlayShuffleButtons onPlay={onPlay} onShuffle={onShuffle} />);
    fireEvent.click(screen.getByLabelText('Play all'));
    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onShuffle).not.toHaveBeenCalled();
  });

  it('calls onShuffle when shuffle button is clicked', () => {
    render(<PlayShuffleButtons onPlay={onPlay} onShuffle={onShuffle} />);
    fireEvent.click(screen.getByLabelText('Shuffle'));
    expect(onShuffle).toHaveBeenCalledTimes(1);
    expect(onPlay).not.toHaveBeenCalled();
  });

  it('disables both buttons when disabled=true', () => {
    render(<PlayShuffleButtons onPlay={onPlay} onShuffle={onShuffle} disabled />);
    expect(screen.getByLabelText('Play all')).toBeDisabled();
    expect(screen.getByLabelText('Shuffle')).toBeDisabled();
  });

  it('does not call onPlay when disabled and clicked', () => {
    render(<PlayShuffleButtons onPlay={onPlay} onShuffle={onShuffle} disabled />);
    fireEvent.click(screen.getByLabelText('Play all'));
    expect(onPlay).not.toHaveBeenCalled();
  });

  it('does not call onShuffle when disabled and clicked', () => {
    render(<PlayShuffleButtons onPlay={onPlay} onShuffle={onShuffle} disabled />);
    fireEvent.click(screen.getByLabelText('Shuffle'));
    expect(onShuffle).not.toHaveBeenCalled();
  });

  it('enables buttons when disabled=false (default)', () => {
    render(<PlayShuffleButtons onPlay={onPlay} onShuffle={onShuffle} />);
    expect(screen.getByLabelText('Play all')).not.toBeDisabled();
    expect(screen.getByLabelText('Shuffle')).not.toBeDisabled();
  });

  it('renders compact round buttons for both when compact=true', () => {
    render(<PlayShuffleButtons onPlay={onPlay} onShuffle={onShuffle} compact />);
    expect(screen.getByLabelText('Play all').className).toContain('w-9');
    expect(screen.getByLabelText('Play all').className).toContain('h-9');
    expect(screen.getByLabelText('Shuffle').className).toContain('w-9');
    expect(screen.getByLabelText('Shuffle').className).toContain('h-9');
  });

  it('renders pill buttons when compact=false', () => {
    render(<PlayShuffleButtons onPlay={onPlay} onShuffle={onShuffle} compact={false} />);
    expect(screen.getByLabelText('Play all').className).toContain('px-2');
    expect(screen.getByLabelText('Shuffle').className).toContain('px-2');
  });

  it('defaults to pill (compact=false) when compact is not specified', () => {
    render(<PlayShuffleButtons onPlay={onPlay} onShuffle={onShuffle} />);
    expect(screen.getByLabelText('Play all').className).toContain('px-2');
    expect(screen.getByLabelText('Play all').className).not.toContain('w-9');
  });
});
