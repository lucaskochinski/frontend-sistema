"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { applyTheme, getStoredTheme } from "@/lib/theme";

/** @typedef {"light" | "dark"} ThemeMode */

const ThemeContext = createContext({
  /** @type {ThemeMode} */
  theme: "dark",
  /** @type {(mode: ThemeMode) => void} */
  setTheme: () => {},
  /** @type {() => void} */
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(/** @type {ThemeMode} */ ("dark"));

  useEffect(() => {
    const initial = getStoredTheme();
    setThemeState(initial);
    applyTheme(initial);
  }, []);

  const setTheme = useCallback((mode) => {
    const next = mode === "light" ? "light" : "dark";
    setThemeState(next);
    applyTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === "light" ? "dark" : "light";
      applyTheme(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
