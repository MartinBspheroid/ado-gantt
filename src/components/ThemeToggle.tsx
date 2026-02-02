import * as React from "react";
import { useTheme } from "../contexts/ThemeContext";
import "../styles/ThemeToggle.css";

interface ThemeToggleProps {
  disabled?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ disabled = false }) => {
  const { theme, toggleTheme, isDarkMode } = useTheme();

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      disabled={disabled}
      aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      data-theme={theme}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {isDarkMode ? "☀️" : "🌙"}
      </span>
      <span className="theme-toggle-text">
        {isDarkMode ? "Light" : "Dark"}
      </span>
    </button>
  );
};

export default ThemeToggle;
