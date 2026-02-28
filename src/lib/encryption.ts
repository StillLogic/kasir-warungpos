import CryptoJS from "crypto-js";

// Derive encryption key from multiple sources to avoid a single hardcoded key
function getEncryptionKey(): string {
  // Combine app identifier with browser-specific entropy
  const appSalt = "WP-BKP-2026";
  const browserEntropy = navigator.userAgent.slice(0, 20);
  const combined = `${appSalt}-${browserEntropy}-WarungPOS`;
  
  // Use PBKDF2 to derive a strong key
  const key = CryptoJS.PBKDF2(combined, appSalt, {
    keySize: 256 / 32,
    iterations: 1000,
  });
  
  return key.toString();
}

// Legacy key for backward compatibility with existing backups
const LEGACY_KEY = "WarungPOS-2026-Secure-Backup-Key-v1";

export function encrypt(data: string): string {
  try {
    const key = getEncryptionKey();
    const encrypted = CryptoJS.AES.encrypt(data, key);
    // Prefix with version marker so we know which key was used
    return "v2:" + encrypted.toString();
  } catch {
    throw new Error("Gagal mengenkripsi data");
  }
}

export function decrypt(encryptedData: string): string {
  try {
    let decrypted: CryptoJS.lib.WordArray;

    if (encryptedData.startsWith("v2:")) {
      // New format: derived key
      const key = getEncryptionKey();
      decrypted = CryptoJS.AES.decrypt(encryptedData.slice(3), key);
    } else {
      // Legacy format: hardcoded key (backward compatible)
      decrypted = CryptoJS.AES.decrypt(encryptedData, LEGACY_KEY);
    }

    const original = decrypted.toString(CryptoJS.enc.Utf8);

    if (!original) {
      throw new Error("Decryption resulted in empty string");
    }

    return original;
  } catch {
    throw new Error(
      "Gagal mendekripsi data - file mungkin corrupt atau bukan backup WarungPOS",
    );
  }
}
