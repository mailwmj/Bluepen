export function parseEditableOptions(value: string): string[] {
  return value
    .split(value.includes("\n") ? "\n" : ",")
    .map((item) => item.trim());
}
