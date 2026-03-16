import { describe, it, expect, vi, beforeEach } from 'vitest';
import { snackbar } from './snackbar';

describe('SnackbarService', () => {
  beforeEach(() => {
    // Reset by registering null-like state
    (snackbar as any).showSnackbarFn = null;
  });

  describe('show', () => {
    it('should call the registered function with props', () => {
      const mockFn = vi.fn();
      snackbar.register(mockFn);

      snackbar.show({ message: 'Hello', color: 'bg-green-500' });

      expect(mockFn).toHaveBeenCalledWith({ message: 'Hello', color: 'bg-green-500' });
    });

    it('should warn if no function is registered', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      snackbar.show({ message: 'Test', color: 'bg-red-500' });

      expect(warnSpy).toHaveBeenCalledWith('Snackbar service not initialized');
      warnSpy.mockRestore();
    });
  });

  describe('register', () => {
    it('should replace the previous registered function', () => {
      const fn1 = vi.fn();
      const fn2 = vi.fn();

      snackbar.register(fn1);
      snackbar.register(fn2);
      snackbar.show({ message: 'X', color: 'bg-blue-500' });

      expect(fn1).not.toHaveBeenCalled();
      expect(fn2).toHaveBeenCalledWith({ message: 'X', color: 'bg-blue-500' });
    });
  });
});
