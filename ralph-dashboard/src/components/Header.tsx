interface HeaderProps {
  viewMode: 'table' | 'card';
  setViewMode: (mode: 'table' | 'card') => void;
}

export function Header({ viewMode, setViewMode }: HeaderProps) {
  return (
    <header className="bg-claude-dark text-white pt-safe pb-3 px-4 sm:pt-4 sm:pb-4 sm:px-6 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl sm:text-3xl">🔄</span>
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold">
              Ralph Dashboard
            </h1>
            <p className="text-claude-cream/70 text-xs sm:text-sm">
              Monitor and manage Ralph Wiggum loops
            </p>
          </div>
        </div>

        {/* View toggle - desktop only */}
        <div
          className="hidden md:flex items-center gap-2"
          data-testid="view-toggle"
        >
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded transition-colors min-h-[44px] min-w-[44px] active:scale-[0.98] active:opacity-80 ${
              viewMode === 'table'
                ? 'bg-claude-coral text-white'
                : 'hover:bg-gray-700 text-gray-300'
            }`}
            data-testid="view-toggle-table"
            title="Table view"
          >
            {/* Table icon - rows */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6h16.5M3.75 12h16.5M3.75 18h16.5"
              />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('card')}
            className={`p-2 rounded transition-colors min-h-[44px] min-w-[44px] active:scale-[0.98] active:opacity-80 ${
              viewMode === 'card'
                ? 'bg-claude-coral text-white'
                : 'hover:bg-gray-700 text-gray-300'
            }`}
            data-testid="view-toggle-card"
            title="Card view"
          >
            {/* Card icon - grid squares */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
