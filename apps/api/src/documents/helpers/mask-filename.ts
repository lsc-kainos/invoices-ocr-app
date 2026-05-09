export function maskFilename(name: string): string {
  if (!name || name.length <= 12) return name;
  const dot = name.lastIndexOf('.');
  const ext = dot > 0 ? name.slice(dot) : '';
  const stem = dot > 0 ? name.slice(0, dot) : name;
  if (stem.length <= 8) return name;
  return `${stem.slice(0, 4)}...${stem.slice(-4)}${ext}`;
}
