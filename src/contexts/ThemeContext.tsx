import * as React from "react";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultTheme = "light" 
}) => {
  // Initialize theme from localStorage or default
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("gantt-theme") as Theme;
      if (stored === "light" || stored === "dark") {
        return stored;
      }
      // Check system preference
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }
    }
    return defaultTheme;
  });

  const isDarkMode = theme === "dark";

  // Apply theme class to document root
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === "dark") {
      root.classList.add("dark-mode");
      root.classList.remove("light-mode");
    } else {
      root.classList.add("light-mode");
      root.classList.remove("dark-mode");
    }

    // Store preference
    localStorage.setItem("gantt-theme", theme);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't manually set a preference
      const hasManualPreference = localStorage.getItem("gantt-theme-manual");
      if (!hasManualPreference) {
        setThemeState(e.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem("gantt-theme-manual", "true");
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    localStorage.setItem("gantt-theme-manual", "true");
    setThemeState(prev => prev === "light" ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export default ThemeContext;
