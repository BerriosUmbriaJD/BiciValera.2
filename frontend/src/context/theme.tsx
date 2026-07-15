import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useColorScheme } from "react-native";
import { storage } from "@/src/utils/storage";
import { lightColors, darkColors, Palette } from "@/src/theme";

type Mode = "light" | "dark" | "system";
const KEY = "bicivalera_theme";

type ThemeState = {
  c: Palette;
  mode: Mode;
  isDark: boolean;
  setMode: (m: Mode) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeState>({} as ThemeState);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<Mode>("system");

  useEffect(() => {
    storage.getItem<Mode>(KEY, "system").then((m) => { if (m) setModeState(m); });
  }, []);

  const setMode = useCallback((m: Mode) => {
    setModeState(m);
    storage.setItem(KEY, m);
  }, []);

  const isDark = mode === "system" ? system === "dark" : mode === "dark";
  const c = isDark ? darkColors : lightColors;

  const toggle = useCallback(() => setMode(isDark ? "light" : "dark"), [isDark, setMode]);

  return (
    <ThemeContext.Provider value={{ c, mode, isDark, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
