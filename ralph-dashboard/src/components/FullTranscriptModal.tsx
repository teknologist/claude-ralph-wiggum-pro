import { useEffect, useRef } from 'react';
import type { TranscriptMessage } from '../../server/types';
import { useFullTranscript } from '../hooks/useTranscript';

interface FullTranscriptModalProps {
  loopId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function FullTranscriptModal({
  loopId,
  isOpen,
  onClose,
}: FullTranscriptModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const { data, isLoading, error } = useFullTranscript(loopId, isOpen);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(e.target as Node) &&
        isOpen
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const messages = data?.messages ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2
            id="modal-title"
            className="text-lg font-semibold text-gray-900 flex items-center gap-2"
          >
            <span>📜</span>
            Full Transcript
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-gray-500">
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Loading transcript...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center text-gray-500">
                <span className="text-4xl mb-2 block">📭</span>
                <p className="text-sm">No full transcript available</p>
                <p className="text-xs text-gray-400 mt-1">
                  Full transcripts are recorded from v2.1.0+
                </p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && messages.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center text-gray-500">
                <span className="text-4xl mb-2 block">📭</span>
                <p className="text-sm">No messages in transcript</p>
              </div>
            </div>
          )}

          {/* Messages */}
          {!isLoading && !error && messages.length > 0 && (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <MessageBubble key={index} message={message} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {messages.length} message{messages.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: TranscriptMessage;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-lg p-4 ${
          isUser
            ? 'bg-claude-coral text-white'
            : 'bg-gray-100 text-gray-800 border border-gray-200'
        }`}
      >
        <div
          className={`text-xs font-medium mb-2 ${
            isUser ? 'text-white/80' : 'text-gray-500'
          }`}
        >
          {isUser ? '👤 You' : '🤖 Claude'}
        </div>
        <div className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </div>
      </div>
    </div>
  );
}
