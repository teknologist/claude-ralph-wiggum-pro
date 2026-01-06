import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../components/Header';
import { ThemeProvider } from '../contexts/ThemeContext';

describe('Header', () => {
  function renderHeader(
    viewMode: 'table' | 'card' = 'table',
    setViewMode = vi.fn()
  ) {
    return render(
      <ThemeProvider>
        <Header viewMode={viewMode} setViewMode={setViewMode} />
      </ThemeProvider>
    );
  }

  it('should render the title', () => {
    renderHeader();
    expect(screen.getByText('Ralph Dashboard')).toBeInTheDocument();
  });

  it('should render the subtitle', () => {
    renderHeader('card');
    expect(
      screen.getByText('Monitor and manage Ralph Wiggum loops')
    ).toBeInTheDocument();
  });

  it('should call setViewMode with "table" when table button is clicked', () => {
    const mockSetViewMode = vi.fn();
    renderHeader('card', mockSetViewMode);

    const tableButton = screen.getByTestId('view-toggle-table');
    fireEvent.click(tableButton);

    expect(mockSetViewMode).toHaveBeenCalledWith('table');
  });

  it('should call setViewMode with "card" when card button is clicked', () => {
    const mockSetViewMode = vi.fn();
    renderHeader('table', mockSetViewMode);

    const cardButton = screen.getByTestId('view-toggle-card');
    fireEvent.click(cardButton);

    expect(mockSetViewMode).toHaveBeenCalledWith('card');
  });
});
