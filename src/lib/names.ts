/** Numele participanților apar peste tot cu prefixul „Dr.", o singură dată. */
export function drName(name: string): string {
  const bare = name.trim().replace(/^(dr|drd)\.?\s+/i, "");
  return `Dr. ${bare}`;
}

export function initials(name: string): string {
  return name
    .trim()
    .replace(/^(dr|drd)\.?\s+/i, "")
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
