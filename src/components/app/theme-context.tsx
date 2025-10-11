
"use client";

import { createContext } from 'react';

interface ThemeContextType {
  currentTheme: string;
  onThemeChange: (theme: string) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
