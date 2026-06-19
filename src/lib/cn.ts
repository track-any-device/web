export type ClassValue = string | false | null | undefined;

/** Join truthy class names (mirrors the design-system components' own pattern). */
export function cn(...parts: ClassValue[]): string {
  return parts.filter(Boolean).join(' ');
}
