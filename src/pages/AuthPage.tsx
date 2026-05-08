import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/ichub/AuthProvider';
import { validateGitHubToken } from '@/services/github-auth';
import { toast } from 'sonner';

const USERNAME_RE = /^[a-zA-Z0-9_]{3,32}$/;
const usernameToEmail = (u: string) => `${u.toLowerCase()}@ichub.local`;

export default function AuthPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = mode === 'login' ? 'Sign in — IC Hub' : 'Create account — IC Hub';
  }, [mode]);

  if (loading) return null;
  if (session) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!USERNAME_RE.test(username)) {
      setError('Username must be 3–32 letters, numbers, or underscores.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setBusy(true);
    try {
      const email = usernameToEmail(username);

      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(`Welcome back, ${username}`);
        navigate('/');
      } else {
        // Registration: validate GitHub PAT as invite gate
        if (!githubToken.trim()) {
          setError('A GitHub token is required to create a new account.');
          setBusy(false);
          return;
        }
        try {
          await validateGitHubToken(githubToken.trim());
        } catch (err: any) {
          setError(`GitHub token invalid: ${err.message}`);
          setBusy(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { username },
          },
        });
        if (error) throw error;
        toast.success(`Account created for ${username}`);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">
            <span className="text-primary">IC</span> Hub
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === 'login' ? 'Sign in to your knowledge base' : 'Create your knowledge base'}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-md bg-secondary p-1">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`rounded py-1.5 text-sm font-medium transition-colors ${mode === 'login' ? 'bg-card text-foreground shadow' : 'text-muted-foreground'}`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            className={`rounded py-1.5 text-sm font-medium transition-colors ${mode === 'register' ? 'bg-card text-foreground shadow' : 'text-muted-foreground'}`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Username</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g. Moaz_IC"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="••••••••"
            />
          </label>

          {mode === 'register' && (
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">
                GitHub invite token
              </span>
              <input
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="ghp_..."
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                A valid GitHub PAT is required to create an account (invite-only).
              </p>
            </label>
          )}

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {busy ? 'Working…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}
