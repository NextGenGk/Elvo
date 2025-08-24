import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export const useCustomTheme = (): 'light' | 'dark' | undefined => {
    const { theme, systemTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Only run on client-side after hydration
    useEffect(() => {
        setMounted(true);
    }, []);

    // Return undefined during SSR to avoid hydration mismatch
    if (!mounted) {
        return undefined;
    }

    if (theme === 'light' || theme === 'dark') {
        return theme;
    }

    // Return systemTheme if it's light or dark, otherwise default to light
    if (systemTheme === 'light' || systemTheme === 'dark') {
        return systemTheme;
    }

    return 'light'; // fallback to light theme
}