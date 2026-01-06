import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '../components/ThemeToggle';
import { ThemeProvider } from '../contexts/ThemeContext';
import { useTheme } from '../contexts/ThemeContext';

// Mock useTheme hook
vi.mock('../contexts/ThemeContext', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../contexts/ThemeContext')>();
  return {
    ...actual,
    useTheme: vi.fn(),
  };
});

describe('ThemeToggle', () => {
  const mockToggleTheme = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTheme).mockReturnValue({
      theme: 'light',
      toggleTheme: mockToggleTheme,
    });
  });

  function renderThemeToggle(initialTheme: 'light' | 'dark' = 'light') {
    vi.mocked(useTheme).mockReturnValue({
      theme: initialTheme,
      toggleTheme: mockToggleTheme,
    });

    return render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );
  }

  it('should render sun icon in light mode', () => {
    renderThemeToggle('light');

    // Sun icon path (from light mode)
    const sunIcon = screen.getByTitle('Switch to dark mode');
    expect(sunIcon).toBeInTheDocument();

    // Check for moon icon path should not be present in light mode
    const svg = sunIcon.querySelector('svg');
    expect(svg).toBeInTheDocument();
    const path = svg?.querySelector('path');
    expect(path?.getAttribute('d')).toContain('21.752 15.002');
  });

  it('should render moon icon in dark mode', () => {
    renderThemeToggle('dark');

    // Moon icon path (from dark mode)
    const moonIcon = screen.getByTitle('Switch to light mode');
    expect(moonIcon).toBeInTheDocument();

    // Check for sun icon path should not be present in dark mode
    const svg = moonIcon.querySelector('svg');
    expect(svg).toBeInTheDocument();
    const path = svg?.querySelector('path');
    expect(path?.getAttribute('d')).toContain('M12 3v2.25');
  });

  it('should call toggleTheme on click', () => {
    renderThemeToggle('light');

    const button = screen.getByTestId('theme-toggle');
    fireEvent.click(button);

    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('should have correct title attribute in light mode', () => {
    renderThemeToggle('light');

    const button = screen.getByTitle('Switch to dark mode');
    expect(button).toBeInTheDocument();
  });

  it('should have correct title attribute in dark mode', () => {
    renderThemeToggle('dark');

    const button = screen.getByTitle('Switch to light mode');
    expect(button).toBeInTheDocument();
  });

  it('should have correct aria-label in light mode', () => {
    renderThemeToggle('light');

    const button = screen.getByLabelText('Switch to dark mode');
    expect(button).toBeInTheDocument();
  });

  it('should have correct aria-label in dark mode', () => {
    renderThemeToggle('dark');

    const button = screen.getByLabelText('Switch to light mode');
    expect(button).toBeInTheDocument();
  });

  it('should have data-testid for testing', () => {
    renderThemeToggle();

    const button = screen.getByTestId('theme-toggle');
    expect(button).toBeInTheDocument();
  });
});
