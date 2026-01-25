"use client";

// @ai:cx - Theme Provider for dark/light mode

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
    theme: Theme;
    resolvedTheme: "light" | "dark";
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
    children: ReactNode;
    defaultTheme?: Theme;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    // Always strict light mode
    const theme = "light";
    const resolvedTheme = "light";
    
    const setTheme = (_newTheme: Theme) => {
        // No-op: theme cannot be changed
        console.log("Theme is locked to light mode");
    };

    // Force data-theme attribute on mount to ensure CSS variables work correctly
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", "light");
        // Remove potentially conflicting class
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
