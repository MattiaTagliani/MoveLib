export const moveLibThemes = [
  "sage",
  "ocean",
  "lavender",
  "rose",
  "sand",
  "slate",
] as const;

export type MoveLibTheme = (typeof moveLibThemes)[number];

export function isMoveLibTheme(value: unknown): value is MoveLibTheme {
  return (
    typeof value === "string" && moveLibThemes.some((theme) => theme === value)
  );
}
