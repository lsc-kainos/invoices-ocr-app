const MAP: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

export function mimeToExt(mime: string): string {
  return MAP[mime] ?? 'bin';
}
