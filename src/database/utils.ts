// Utility untuk ID pendek dan kompresi data

const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

// Generate ID pendek 8 karakter
export function generateId(): string {
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return id;
}

// Konversi ISO string ke Unix timestamp (dalam detik)
export function toUnix(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  return Math.floor(d.getTime() / 1000);
}

// Konversi Unix timestamp ke ISO string
export function fromUnix(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString();
}

// Hitung ukuran data dalam localStorage (bytes)
export function getStorageSize(): { used: number; formatted: string } {
  let total = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage.getItem(key)?.length || 0;
    }
  }
  const bytes = total * 2; // UTF-16 = 2 bytes per char
  
  if (bytes < 1024) return { used: bytes, formatted: `${bytes} B` };
  if (bytes < 1048576) return { used: bytes, formatted: `${(bytes / 1024).toFixed(1)} KB` };
  return { used: bytes, formatted: `${(bytes / 1048576).toFixed(2)} MB` };
}
