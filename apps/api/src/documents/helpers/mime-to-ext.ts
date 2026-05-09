const MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/pdf': 'pdf',
};

export function mimeToExt(mime: string): string {
  return MAP[mime] ?? 'bin';
}
