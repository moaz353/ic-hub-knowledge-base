import { useState, useEffect, createContext, useContext, useCallback, type ReactNode } from 'react';
import { getToken, setToken, clearToken, isTokenActive, ICHUB_AUTH_EVENT } from '@/services/auth';
import { validateGitHubToken } from '@/services/github-auth';

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
  const [tokenError, setTokenError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    const syncAuthState = () => setHasToken(isTokenActive());
    window.addEventListener(ICHUB_AUTH_EVENT, syncAuthState);
    return () => window.removeEventListener(ICHUB_AUTH_EVENT, syncAuthState);
  }, []);

  const requireToken = useCallback((): Promise<string | null> => {
    const existing = getToken();
    if (existing) return Promise.resolve(existing);
    return new Promise<string | null>((resolve) => {
      setResolver(() => resolve);
      setTokenInput('');
      setTokenError('');
      setShowModal(true);
    });
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setHasToken(false);
  }, []);

  const handleConfirm = async () => {
    const trimmedToken = tokenInput.trim();
    if (!trimmedToken || isValidating) return;

    setIsValidating(true);
    setTokenError('');

    try {
      await validateGitHubToken(trimmedToken);

      if (remember) {
        setToken(trimmedToken);
      }

      setHasToken(true);
      setShowModal(false);
      resolver?.(trimmedToken);
      setResolver(null);
    } catch (error: any) {
      setHasToken(isTokenActive());
      setTokenError(error?.message || 'Failed to validate GitHub token.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setTokenError('');
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
               onChange={(e) => {
                 setTokenInput(e.target.value);
                 if (tokenError) setTokenError('');
               }}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="mb-3 w-full rounded-md border border-border bg-secondary px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
              autoFocus
            />
             <p className="mb-3 text-xs text-muted-foreground">
               Fine-Grained PAT required: repository access + Contents (Read and Write) + Metadata (Read).
             </p>
             {tokenError && (
               <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                 {tokenError}
               </p>
             )}
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
                  disabled={isValidating}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                  {isValidating ? 'Checking...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}
