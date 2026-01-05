import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FullTranscriptModal } from '../components/FullTranscriptModal';
import React from 'react';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('FullTranscriptModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when closed', () => {
    it('renders nothing when isOpen is false', () => {
      render(
        <FullTranscriptModal
          loopId="loop-123"
          isOpen={false}
          onClose={vi.fn()}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('when open', () => {
    it('renders modal with title', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          messages: [
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi there!' },
          ],
        }),
      } as Response);

      render(
        <FullTranscriptModal
          loopId="loop-123"
          isOpen={true}
          onClose={vi.fn()}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Full Transcript')).toBeInTheDocument();
    });

    it('shows loading state while fetching', async () => {
      vi.mocked(global.fetch).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(
        <FullTranscriptModal
          loopId="loop-123"
          isOpen={true}
          onClose={vi.fn()}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('Loading transcript...')).toBeInTheDocument();
      });
    });

    it('shows error state when fetch fails', async () => {
      // Mock fetch to reject - this simulates a network error or API error
      // Use mockImplementation to ensure all retries also fail
      vi.mocked(global.fetch).mockImplementation(() =>
        Promise.reject(new Error('Not found'))
      );

      render(
        <FullTranscriptModal
          loopId="loop-123"
          isOpen={true}
          onClose={vi.fn()}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(
        () => {
          expect(
            screen.getByText('No full transcript available')
          ).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    it('displays messages with correct roles', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          messages: [
            { role: 'user', content: 'User message here' },
            { role: 'assistant', content: 'Assistant response here' },
          ],
        }),
      } as Response);

      render(
        <FullTranscriptModal
          loopId="loop-123"
          isOpen={true}
          onClose={vi.fn()}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('User message here')).toBeInTheDocument();
        expect(screen.getByText('Assistant response here')).toBeInTheDocument();
      });
    });

    it('shows message count in footer', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          messages: [
            { role: 'user', content: 'First' },
            { role: 'assistant', content: 'Second' },
            { role: 'user', content: 'Third' },
          ],
        }),
      } as Response);

      render(
        <FullTranscriptModal
          loopId="loop-123"
          isOpen={true}
          onClose={vi.fn()}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('3 messages')).toBeInTheDocument();
      });
    });

    it('shows singular message count', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          messages: [{ role: 'user', content: 'Only one' }],
        }),
      } as Response);

      render(
        <FullTranscriptModal
          loopId="loop-123"
          isOpen={true}
          onClose={vi.fn()}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('1 message')).toBeInTheDocument();
      });
    });

    it('shows empty state when no messages', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          messages: [],
        }),
      } as Response);

      render(
        <FullTranscriptModal
          loopId="loop-123"
          isOpen={true}
          onClose={vi.fn()}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(
          screen.getByText('No messages in transcript')
        ).toBeInTheDocument();
      });
    });
  });

  describe('closing behavior', () => {
    it('calls onClose when close button is clicked', async () => {
      const onClose = vi.fn();
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messages: [] }),
      } as Response);

      render(
        <FullTranscriptModal
          loopId="loop-123"
          isOpen={true}
          onClose={onClose}
        />,
        { wrapper: createWrapper() }
      );

      fireEvent.click(screen.getByLabelText('Close modal'));
      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when Close button in footer is clicked', async () => {
      const onClose = vi.fn();
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messages: [] }),
      } as Response);

      render(
        <FullTranscriptModal
          loopId="loop-123"
          isOpen={true}
          onClose={onClose}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('Close')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Close'));
      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when Escape key is pressed', async () => {
      const onClose = vi.fn();
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messages: [] }),
      } as Response);

      render(
        <FullTranscriptModal
          loopId="loop-123"
          isOpen={true}
          onClose={onClose}
        />,
        { wrapper: createWrapper() }
      );

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when clicking outside modal', async () => {
      const onClose = vi.fn();
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messages: [] }),
      } as Response);

      render(
        <FullTranscriptModal
          loopId="loop-123"
          isOpen={true}
          onClose={onClose}
        />,
        { wrapper: createWrapper() }
      );

      // Click on the backdrop (the parent container with the dialog role's parent)
      const backdrop = screen.getByRole('dialog').parentElement;
      fireEvent.mouseDown(backdrop!);
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('body scroll lock', () => {
    it('locks body scroll when open', () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messages: [] }),
      } as Response);

      render(
        <FullTranscriptModal
          loopId="loop-123"
          isOpen={true}
          onClose={vi.fn()}
        />,
        { wrapper: createWrapper() }
      );

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when closed', () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messages: [] }),
      } as Response);

      const { rerender } = render(
        <FullTranscriptModal
          loopId="loop-123"
          isOpen={true}
          onClose={vi.fn()}
        />,
        { wrapper: createWrapper() }
      );

      rerender(
        <QueryClientProvider
          client={
            new QueryClient({
              defaultOptions: { queries: { retry: false } },
            })
          }
        >
          <FullTranscriptModal
            loopId="loop-123"
            isOpen={false}
            onClose={vi.fn()}
          />
        </QueryClientProvider>
      );

      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('accessibility', () => {
    it('has correct ARIA attributes', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messages: [] }),
      } as Response);

      render(
        <FullTranscriptModal
          loopId="loop-123"
          isOpen={true}
          onClose={vi.fn()}
        />,
        { wrapper: createWrapper() }
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    });
  });
});
