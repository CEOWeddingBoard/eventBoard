const MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export function validateUploadFile(file: File): string | null {
  if (file.size > MAX_BYTES) {
    return "Plik jest za duży (max 10 MB).";
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return "Niedozwolony typ pliku.";
  }
  return null;
}
