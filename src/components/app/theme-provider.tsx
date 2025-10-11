
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"
import { ThemeContext } from "./theme-context"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false);
  const [colorTheme, setColorTheme] = React.useState('orange');

  React.useEffect(() => {
    setMounted(true);
    try {
      const storedColorTheme = localStorage.getItem('color-theme');
      if (storedColorTheme && ['orange', 'blue', 'green', 'rose'].includes(storedColorTheme)) {
        setColorTheme(storedColorTheme);
      }
    } catch (error) {
      console.error("Could not read color-theme from localStorage", error);
    }
  }, []);

  React.useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute('data-theme', colorTheme);
       try {
        localStorage.setItem('color-theme', colorTheme);
      } catch (error) {
        console.error("Could not save color-theme to localStorage", error);
      }
    }
  }, [colorTheme, mounted]);
  
  const handleThemeChange = (newTheme: string) => {
    setColorTheme(newTheme);
  };
  
  const contextValue = {
    currentTheme: colorTheme,
    onThemeChange: handleThemeChange
  };
  
  return (
    <NextThemesProvider {...props}>
      <ThemeContext.Provider value={contextValue}>
        {children}
      </ThemeContext.Provider>
    </NextThemesProvider>
  );
}
