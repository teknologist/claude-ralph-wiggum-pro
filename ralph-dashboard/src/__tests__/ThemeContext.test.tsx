import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor, render } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';

describe('ThemeContext - uncovered paths', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  describe('getInitialTheme', () => {
    it('should return stored light theme from localStorage', async () => {
      localStorage.setItem('ralph-dashboard-theme', 'light');

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      await waitFor(() => expect(result.current).not.toBeNull());

      expect(result.current?.theme).toBe('light');
    });

    it('should return stored dark theme from localStorage', async () => {
      localStorage.setItem('ralph-dashboard-theme', 'dark');

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      await waitFor(() => expect(result.current).not.toBeNull());

      expect(result.current?.theme).toBe('dark');
    });

    it('should fall back to system theme when no stored value', async () => {
      // No localStorage value set, should use system theme (mocked to light mode)
      window.matchMedia = vi.fn().mockReturnValue({
        matches: false,
        media: '',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      });

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      await waitFor(() => expect(result.current).not.toBeNull());

      expect(result.current?.theme).toBe('light');
    });
  });

  describe('getSystemTheme', () => {
    it('should return dark when prefers-color-scheme is dark', async () => {
      window.matchMedia = vi.fn().mockReturnValue({
        matches: true,
        media: '',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      });

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      await waitFor(() => expect(result.current).not.toBeNull());

      expect(result.current?.theme).toBe('dark');
    });

    it('should return light when prefers-color-scheme is light', async () => {
      window.matchMedia = vi.fn().mockReturnValue({
        matches: false,
        media: '',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      });

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      await waitFor(() => expect(result.current).not.toBeNull());

      expect(result.current?.theme).toBe('light');
    });
  });

  describe('toggleTheme', () => {
    it('should save theme to localStorage', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      await waitFor(() => expect(result.current).not.toBeNull());

      act(() => {
        result.current?.toggleTheme();
      });

      expect(localStorage.getItem('ralph-dashboard-theme')).toBe('dark');
    });

    it('should handle localStorage disabled gracefully', async () => {
      // Spy on localStorage.setItem to throw errors
      const setItemSpy = vi
        .spyOn(Storage.prototype, 'setItem')
        .mockImplementation(() => {
          throw new Error('localStorage disabled');
        });

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      await waitFor(() => expect(result.current).not.toBeNull());

      // Should not throw, just continue silently
      expect(() => {
        act(() => {
          result.current?.toggleTheme();
        });
      }).not.toThrow();

      setItemSpy.mockRestore();
    });
  });

  describe('ThemeProvider', () => {
    it('should render children after initialization', async () => {
      const TestComponent = () => {
        const theme = useTheme();
        return <div>{theme ? 'initialized' : 'loading'}</div>;
      };

      const { getByText } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(getByText('initialized')).toBeInTheDocument();
      });
    });
  });

  describe('useTheme', () => {
    it('should throw error when used outside ThemeProvider', () => {
      // Suppress the expected error
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useTheme());
      }).toThrow('useTheme must be used within ThemeProvider');

      consoleSpy.mockRestore();
    });
  });
});
