import { useState, createContext, useContext, useCallback, type ReactNode } from 'react';
import { getToken, setToken, clearToken, isTokenActive } from '@/services/auth';

interface AuthContextType {
  hasToken: boolean;
  requireToken: () => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  hasToken: false,
  requireToken: async () => null,
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [hasToken, setHasToken] = useState(isTokenActive());
  const [resolver, setResolver] = useState<((token: string | null) => void) | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [remember, setRemember] = useState(true);

  const requireToken = useCallback((): Promise<string | null> => {
    const existing = getToken();
    if (existing) return Promise.resolve(existing);
    return new Promise<string | null>((resolve) => {
      setResolver(() => resolve);
      setTokenInput('');
      setShowModal(true);
    });
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setHasToken(false);
  }, []);

  const handleConfirm = () => {
    if (!tokenInput.trim()) return;
    if (remember) {
      setToken(tokenInput.trim());
    }
    setHasToken(true);
    setShowModal(false);
    resolver?.(tokenInput.trim());
    setResolver(null);
  };

  const handleCancel = () => {
    setShowModal(false);
    resolver?.(null);
    setResolver(null);
  };

  return (
    <AuthContext.Provider value={{ hasToken, requireToken, logout }}>
      {children}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Enter your GitHub Token</h3>
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="mb-3 w-full rounded-md border border-border bg-secondary px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
              autoFocus
            />
            <label className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded"
              />
              Remember for this session
            </label>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancel}
                className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}
