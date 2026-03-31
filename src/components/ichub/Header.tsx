import { Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { useState, useEffect, useRef } from 'react';

export default function Header() {
  const { hasToken, logout } = useAuth();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          e.preventDefault();
          setSearchOpen(true);
          setTimeout(() => searchRef.current?.focus(), 50);
        }
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/tags', label: 'Tags' },
    { to: '/queue', label: 'Watch Later' },
  ];

  return (
    <header className="no-print sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">IC</span>
            <span className="text-2xl font-bold text-foreground">Hub</span>
          </Link>
          <span className="hidden text-xs text-muted-foreground sm:block">
            Personal Knowledge Base — VLSI & Verification
          </span>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                location.pathname === link.to
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* Search toggle */}
          <button
            onClick={() => {
              setSearchOpen(!searchOpen);
              setTimeout(() => searchRef.current?.focus(), 50);
            }}
            className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
            title='Search (press "/")'
          >
            <span className="text-lg">⌕</span>
          </button>

          {/* Token status */}
          <button
            onClick={() => hasToken && logout()}
            className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
              hasToken
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-border bg-secondary text-muted-foreground'
            }`}
            title={hasToken ? 'Click to clear token' : 'Browse mode'}
          >
            <span>{hasToken ? '⚿' : '⊘'}</span>
            <span className="hidden sm:inline">{hasToken ? 'Edit mode' : 'Browse mode'}</span>
          </button>
        </div>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div className="border-t border-border bg-card px-4 py-3">
          <form onSubmit={handleSearch} className="mx-auto max-w-2xl">
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search all items... (title, description, tags)"
              className="w-full rounded-md border border-border bg-secondary px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </form>
        </div>
      )}
    </header>
  );
}
