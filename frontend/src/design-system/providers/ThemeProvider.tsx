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
  defaultTheme = 'light',
  storageKey = 'ui-theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>('light');
  const [resolvedTheme, setResolvedTheme] = React.useState<'light' | 'dark' | 'brand' | 'forest'>('light');

  const setTheme = React.useCallback(
    (nextTheme: Theme) => {
      setThemeState('light');
      localStorage.setItem(storageKey, 'light');
    },
    [storageKey]
  );

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark', 'brand', 'forest');
    root.classList.add('light');
    localStorage.setItem(storageKey, 'light');
    setThemeState('light');
    setResolvedTheme('light');
  }, [storageKey]);

  const value = React.useMemo(
    () => ({
      theme: 'light' as Theme,
      resolvedTheme: 'light' as const,
      setTheme,
    }),
    [setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
