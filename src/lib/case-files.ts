export const MAX_CASE_FILE_BYTES = 50 * 1024 * 1024;
export const MAX_CASE_FILES = 8;
export const CASE_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "webp", "heic", "zip", "dcm", "stl", "ply", "obj"];

export function caseExtension(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export function safeFileName(name: string): string {
  const ext = caseExtension(name);
  const base = name.replace(/\.[^.]+$/, "").normalize("NFD").replace(/\p{M}/gu, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "fisier";
  return `${base}.${ext}`;
}
