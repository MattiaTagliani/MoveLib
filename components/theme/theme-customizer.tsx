"use client";

import { Button } from "@/components/ui/button";
import { useMoveLibTheme } from "@/components/theme/movelib-theme-provider";
import type { MoveLibTheme } from "@/lib/movelib-theme";
import { Check, Palette, X } from "lucide-react";
import { useState } from "react";

interface PaletteOption {
  id: MoveLibTheme;
  name: string;
  colors: [string, string, string];
}

const palettes: PaletteOption[] = [
  {
    id: "sage",
    name: "Salvia",
    colors: ["#477a55", "#dce9df", "#f7faf7"],
  },
  {
    id: "ocean",
    name: "Oceano",
    colors: ["#2f6e94", "#d8e9f3", "#f7fafc"],
  },
  {
    id: "lavender",
    name: "Lavanda",
    colors: ["#68509a", "#e6e0f2", "#faf9fc"],
  },
  {
    id: "rose",
    name: "Rosa",
    colors: ["#9f3d55", "#f1dce2", "#fcf8f9"],
  },
  {
    id: "sand",
    name: "Sabbia",
    colors: ["#825e3a", "#eadfce", "#faf8f3"],
  },
  {
    id: "slate",
    name: "Ardesia",
    colors: ["#48566a", "#e0e4e9", "#f8f9fa"],
  },
];

export function ThemeCustomizer() {
  const { theme, setTheme, isSavingTheme } = useMoveLibTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function chooseTheme(newTheme: MoveLibTheme) {
    setError(null);

    const success = await setTheme(newTheme);

    if (!success) {
      setError("Non è stato possibile salvare il tema.");
    }
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 gap-2 shadow-lg"
      >
        <Palette className="h-4 w-4" />
        Personalizza MoveLib
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/25"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <aside className="absolute bottom-0 right-0 top-0 flex w-full max-w-sm flex-col border-l bg-card shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b p-5">
              <div>
                <h2 className="text-lg font-semibold">Personalizza MoveLib</h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Scegli i colori dell&apos;app.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                aria-label="Chiudi personalizzazione"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <p className="mb-3 text-sm font-medium">Palette</p>

              <div className="grid grid-cols-2 gap-3">
                {palettes.map((palette) => {
                  const selected = theme === palette.id;

                  return (
                    <button
                      key={palette.id}
                      type="button"
                      disabled={isSavingTheme}
                      onClick={() => void chooseTheme(palette.id)}
                      className={`relative cursor-pointer rounded-xl border p-3 text-left transition-all hover:border-primary/60 disabled:cursor-wait disabled:opacity-70 ${
                        selected
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border"
                      }`}
                    >
                      {selected && (
                        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3 w-3" />
                        </span>
                      )}

                      <div className="mb-3 flex gap-1">
                        {palette.colors.map((color) => (
                          <span
                            key={color}
                            className="h-8 flex-1 rounded-md border"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>

                      <p className="text-sm font-semibold">{palette.name}</p>
                    </button>
                  );
                })}
              </div>

              {error && (
                <p className="mt-4 text-sm text-destructive">{error}</p>
              )}

              <div className="mt-6 rounded-lg bg-muted p-4">
                <p className="text-sm font-medium">
                  La tua scelta viene salvata automaticamente.
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  La stessa palette verrà utilizzata quando accedi a MoveLib da
                  un altro dispositivo.
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
