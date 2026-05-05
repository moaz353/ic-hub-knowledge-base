import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'dark' | 'light';

function applyTheme(t: Theme) {
  const root = document.documentElement;
  if (t === 'light') root.classList.add('light');
  else root.classList.remove('light');
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';
    return (localStorage.getItem('ichub-theme') as Theme) || 'dark';
  });
  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('ichub-theme', theme);
  }, [theme]);
  return { theme, setTheme, toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark') };
}

export default function ThemeToggle({ collapsed }: { collapsed?: boolean }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent px-2.5 py-1.5 text-xs font-medium text-sidebar-foreground/80 hover:text-sidebar-foreground transition-colors w-full justify-center"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
      {!collapsed && <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>}
    </button>
  );
}
