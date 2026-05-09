// Encode value para uso em filename do Content-Disposition.
// RFC 5987 / RFC 6266: percent-encoded UTF-8, com escapes adicionais para
// caracteres reservados não cobertos por encodeURIComponent.
export function encodeRFC5987(value: string): string {
  return encodeURIComponent(value)
    .replace(/['()]/g, encodeURIComponent)
    .replace(/\*/g, '%2A')
    .replace(/%(?:7C|60|5E)/g, decodeURIComponent);
}
