"use client";

import { createClient } from "@/lib/supabase/client";
import { createContext, useContext, useState, type ReactNode } from "react";
import type { MoveLibTheme } from "@/lib/movelib-theme";

interface MoveLibThemeContextValue {
  theme: MoveLibTheme;
  setTheme: (theme: MoveLibTheme) => Promise<boolean>;
  isSavingTheme: boolean;
}

const MoveLibThemeContext = createContext<MoveLibThemeContextValue | null>(
  null,
);

interface MoveLibThemeProviderProps {
  initialTheme: MoveLibTheme;
  children: ReactNode;
}

export function MoveLibThemeProvider({
  initialTheme,
  children,
}: MoveLibThemeProviderProps) {
  const [theme, setThemeState] = useState<MoveLibTheme>(initialTheme);
  const [isSavingTheme, setIsSavingTheme] = useState(false);

  async function setTheme(newTheme: MoveLibTheme) {
    if (newTheme === theme || isSavingTheme) {
      return true;
    }

    const previousTheme = theme;

    setThemeState(newTheme);
    setIsSavingTheme(true);

    const supabase = createClient();

    const { error } = await supabase.rpc("set_my_theme", {
      new_theme: newTheme,
    });

    setIsSavingTheme(false);

    if (error) {
      setThemeState(previousTheme);
      return false;
    }

    return true;
  }

  return (
    <MoveLibThemeContext.Provider
      value={{
        theme,
        setTheme,
        isSavingTheme,
      }}
    >
      <div
        data-theme={theme}
        className="min-h-screen bg-background text-foreground transition-colors"
      >
        {children}
      </div>
    </MoveLibThemeContext.Provider>
  );
}

export function useMoveLibTheme() {
  const context = useContext(MoveLibThemeContext);

  if (!context) {
    throw new Error(
      "useMoveLibTheme must be used inside MoveLibThemeProvider.",
    );
  }

  return context;
}
