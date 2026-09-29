"use client";

interface TimePickerProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
}

const HOURS = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, "0"),
);

const MINUTES = [
  "00",
  "05",
  "10",
  "15",
  "20",
  "25",
  "30",
  "35",
  "40",
  "45",
  "50",
  "55",
];

export function TimePicker({ id, value, onChange }: TimePickerProps) {
  const [hour = "", minute = ""] = value ? value.split(":") : [];

  function changeHour(newHour: string) {
    if (!newHour) {
      onChange("");
      return;
    }

    onChange(`${newHour}:${minute || "00"}`);
  }

  function changeMinute(newMinute: string) {
    if (!newMinute) {
      return;
    }

    onChange(`${hour || "00"}:${newMinute}`);
  }

  return (
    <div id={id} className="grid grid-cols-2 gap-2">
      <select
        aria-label="Ora"
        value={hour}
        onChange={(event) => changeHour(event.target.value)}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
      >
        <option value="">Ora</option>

        {HOURS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <select
        aria-label="Minuti"
        value={minute}
        onChange={(event) => changeMinute(event.target.value)}
        disabled={!hour}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">Minuti</option>

        {MINUTES.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
