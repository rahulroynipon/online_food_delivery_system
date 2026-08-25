import * as React from 'react';

export type Theme = 'light' | 'dark' | 'brand' | 'forest' | 'system';

export interface ThemeContextProps {
  theme: Theme;
  resolvedTheme: 'light' | 'dark' | 'brand' | 'forest';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = React.createContext<ThemeContextProps | undefined>(undefined);

export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Track last click coordinates globally to animate wave transition from origin
let lastClickX = 0;
let lastClickY = 0;

if (typeof window !== 'undefined') {
  window.addEventListener(
    'click',
    (e) => {
      lastClickX = e.clientX;
      lastClickY = e.clientY;
    },
    { capture: true }
  );
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'ui-theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = React.useState<'light' | 'dark' | 'brand' | 'forest'>(
    'light'
  );

  React.useEffect(() => {
    const saved = localStorage.getItem(storageKey) as Theme;
    if (saved) {
      setThemeState(saved);
    }
  }, [storageKey]);

  const setTheme = React.useCallback(
    (nextTheme: Theme) => {
      // Fallback for browsers that don't support View Transitions API
      if (!(document as any).startViewTransition) {
        setThemeState(nextTheme);
        localStorage.setItem(storageKey, nextTheme);
        return;
      }

      const x = lastClickX || window.innerWidth / 2;
      const y = lastClickY || window.innerHeight / 2;
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      const transition = (document as any).startViewTransition(() => {
        React.startTransition(() => {
          setThemeState(nextTheme);
          localStorage.setItem(storageKey, nextTheme);
        });
      });

      transition.ready.then(() => {
        const clipPath = [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ];
        document.documentElement.animate(
          {
            clipPath: clipPath,
            filter: ['blur(2px)', 'blur(0px)'],
            transform: ['scale(1.02)', 'scale(1)'],
          },
          {
            duration: 700,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            pseudoElement: '::view-transition-new(root)',
          }
        );
      });
    },
    [storageKey]
  );

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'brand', 'forest');

    let active: 'light' | 'dark' | 'brand' | 'forest' = 'light';

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      active = systemTheme;
    } else {
      active = theme as 'light' | 'dark' | 'brand' | 'forest';
    }

    root.classList.add(active);
    setResolvedTheme(active);
  }, [theme]);

  // Sync system theme changes dynamically
  React.useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark', 'brand');
      const active = mediaQuery.matches ? 'dark' : 'light';
      root.classList.add(active);
      setResolvedTheme(active);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const value = React.useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [theme, resolvedTheme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
