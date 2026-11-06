import { createContext, useContext, useEffect, useState } from 'react';
import { applyDocumentTheme, readThemePreference, resolveTheme, saveThemePreference } from './theme.js';

const ThemeContext = createContext(null);
const systemQuery = '(prefers-color-scheme: dark)';
function storage() { try { return window.localStorage; } catch { return null; } }

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(() => readThemePreference(storage()));
  const [systemDark, setSystemDark] = useState(() => window.matchMedia?.(systemQuery).matches ?? true);
  const [saveError, setSaveError] = useState(false);
  const theme = resolveTheme(preference, systemDark);

  useEffect(() => {
    const media = window.matchMedia?.(systemQuery);
    if (!media) return;
    const change = event => setSystemDark(event.matches);
    setSystemDark(media.matches);
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);

  useEffect(() => {
    applyDocumentTheme(document, theme);
  }, [theme]);

  function chooseTheme(value) {
    setPreference(value);
    setSaveError(!saveThemePreference(storage(), value));
  }

  return <ThemeContext.Provider value={{ preference, theme, chooseTheme }}>{children}{saveError && <p className="theme-save-warning" role="status">Theme changed for this visit. Browser storage could not save the preference.</p>}</ThemeContext.Provider>;
}

export function ThemeSwitcher() {
  const { preference, chooseTheme } = useTheme();
  return <label className="theme-switcher">Theme<select value={preference} onChange={event => chooseTheme(event.target.value)} aria-label="Color theme"><option value="dark">Dark</option><option value="light">Light</option><option value="system">System</option></select></label>;
}

export function useTheme() { return useContext(ThemeContext); }
