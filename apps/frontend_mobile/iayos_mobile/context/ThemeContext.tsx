/**
 * ThemeContext - User-controlled dark/light mode preference.
 *
 * The preference is stored in AsyncStorage under '@iayos_theme' so it
 * persists across app restarts. Components can call useTheme() to read
 * isDarkMode and toggleTheme().
 *
 * Integration points:
 *  - _layout.tsx wraps the tree with AppThemeProvider so the navigation
 *    ThemeProvider (react-navigation) picks up the user's choice instead of
 *    only the system setting.
 *  - settings/index.tsx replaces its local state with useTheme() so the
 *    toggle is always in sync with the stored preference.
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_KEY = "@iayos_theme";

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleTheme: async () => {},
});

export const AppThemeProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load stored preference once on mount
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then((value) => {
        if (value) setIsDarkMode(value === "dark");
      })
      .catch(() => {
        // Default to light mode if storage fails
      });
  }, []);

  const toggleTheme = useCallback(async () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    try {
      await AsyncStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {
      // Non-critical — preference just won't persist
    }
  }, [isDarkMode]);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => useContext(ThemeContext);
