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

export function ThemeProvider({ children, defaultTheme = "system" }: ThemeProviderProps) {
    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window === "undefined") return defaultTheme;
        const stored = localStorage.getItem("theme") as Theme | null;
        if (stored && ["light", "dark", "system"].includes(stored)) {
            return stored;
        }
        return defaultTheme;
    });
    const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

    // Resolve system theme and apply to document
    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

        const updateResolvedTheme = () => {
            let resolved: "light" | "dark";
            if (theme === "system") {
                resolved = mediaQuery.matches ? "dark" : "light";
            } else {
                resolved = theme;
            }
            setResolvedTheme(resolved);
            document.documentElement.setAttribute("data-theme", resolved);
        };

        updateResolvedTheme();

        mediaQuery.addEventListener("change", updateResolvedTheme);
        return () => mediaQuery.removeEventListener("change", updateResolvedTheme);
    }, [theme]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem("theme", newTheme);
    };

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
