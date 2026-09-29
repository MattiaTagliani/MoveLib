"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export interface CustomCalendarColor {
  id: string;
  color: string;
}

interface CalendarColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  customColors: CustomCalendarColor[];
  onCustomColorCreated: (color: CustomCalendarColor) => void;
  onCustomColorDeleted: (id: string) => void;
}

const DEFAULT_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#ef4444",
  "#f97316",
  "#a855f7",
  "#ec4899",
  "#06b6d4",
  "#eab308",
  "#6366f1",
  "#6b7280",
];

export function CalendarColorPicker({
  value,
  onChange,
  customColors,
  onCustomColorCreated,
  onCustomColorDeleted,
}: CalendarColorPickerProps) {
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customColor, setCustomColor] = useState("#3b82f6");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveCustomColor() {
    setIsSaving(true);
    setError(null);

    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("Utente non autenticato.");
      setIsSaving(false);
      return;
    }

    const alreadyExists =
      DEFAULT_COLORS.includes(customColor.toLowerCase()) ||
      customColors.some(
        (savedColor) =>
          savedColor.color.toLowerCase() === customColor.toLowerCase(),
      );

    if (alreadyExists) {
      onChange(customColor);
      setShowCustomPicker(false);
      setIsSaving(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("user_calendar_colors")
      .insert({
        user_id: user.id,
        color: customColor,
      })
      .select("id, color")
      .single();

    if (insertError) {
      setError(insertError.message);
      setIsSaving(false);
      return;
    }

    onCustomColorCreated(data);
    onChange(data.color);

    setShowCustomPicker(false);
    setIsSaving(false);
  }

  async function deleteCustomColor(id: string) {
    setDeletingId(id);
    setError(null);

    const supabase = createClient();

    const { error: deleteError } = await supabase
      .from("user_calendar_colors")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      setDeletingId(null);
      return;
    }

    onCustomColorDeleted(id);
    setDeletingId(null);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {DEFAULT_COLORS.map((color) => (
          <ColorButton
            key={color}
            color={color}
            selected={value.toLowerCase() === color.toLowerCase()}
            onClick={() => onChange(color)}
          />
        ))}

        {customColors.map((savedColor) => (
          <div key={savedColor.id} className="group relative">
            <ColorButton
              color={savedColor.color}
              selected={value.toLowerCase() === savedColor.color.toLowerCase()}
              onClick={() => onChange(savedColor.color)}
            />

            <button
              type="button"
              onClick={() => void deleteCustomColor(savedColor.id)}
              disabled={deletingId === savedColor.id}
              className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-background text-[10px] shadow group-hover:flex"
              aria-label="Elimina colore personalizzato"
              title="Elimina colore personalizzato"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {!showCustomPicker ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowCustomPicker(true)}
        >
          + Colore personalizzato
        </Button>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="color"
            value={customColor}
            onChange={(event) => setCustomColor(event.target.value)}
            className="h-9 w-12 cursor-pointer rounded border bg-background p-1"
            aria-label="Colore personalizzato"
          />

          <Button
            type="button"
            size="sm"
            onClick={() => void saveCustomColor()}
            disabled={isSaving}
          >
            {isSaving ? "Salvataggio..." : "Salva colore"}
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setShowCustomPicker(false)}
            disabled={isSaving}
          >
            Annulla
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

interface ColorButtonProps {
  color: string;
  selected: boolean;
  onClick: () => void;
}

function ColorButton({ color, selected, onClick }: ColorButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 w-8 rounded-full transition-transform hover:scale-110 ${
        selected ? "ring-2 ring-foreground ring-offset-2" : ""
      }`}
      style={{ backgroundColor: color }}
      aria-label={`Seleziona colore ${color}`}
      title={color}
    />
  );
}
