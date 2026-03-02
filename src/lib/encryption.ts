import CryptoJS from "crypto-js";

const LEGACY_KEY = "WarungPOS-2026-Secure-Backup-Key-v1";
const SALT = "WarungPOS-PBKDF2-Salt-v2";
const ITERATIONS = 10000;
const KEY_SIZE = 256 / 32;
const MARKER = "WPOS2:";

function deriveKey(password: string): CryptoJS.lib.WordArray {
  return CryptoJS.PBKDF2(password, SALT, {
    keySize: KEY_SIZE,
    iterations: ITERATIONS,
  });
}

export function encrypt(data: string, password: string): string {
  const key = deriveKey(password);
  const iv = CryptoJS.lib.WordArray.random(16);
  const encrypted = CryptoJS.AES.encrypt(data, key, { iv });
  return MARKER + iv.toString() + ":" + encrypted.toString();
}

export function decrypt(encryptedData: string, password: string): string {
  try {
    if (encryptedData.startsWith(MARKER)) {
      const payload = encryptedData.slice(MARKER.length);
      const colonIdx = payload.indexOf(":");
      if (colonIdx === -1) throw new Error("Invalid format");
      const ivHex = payload.slice(0, colonIdx);
      const ciphertext = payload.slice(colonIdx + 1);
      const iv = CryptoJS.enc.Hex.parse(ivHex);
      const key = deriveKey(password);
      const decrypted = CryptoJS.AES.decrypt(ciphertext, key, { iv });
      const result = decrypted.toString(CryptoJS.enc.Utf8);
      if (!result) throw new Error("Wrong password");
      return result;
    }

    const decrypted = CryptoJS.AES.decrypt(encryptedData, LEGACY_KEY);
    const result = decrypted.toString(CryptoJS.enc.Utf8);
    if (!result) throw new Error("Decryption failed");
    return result;
  } catch {
    throw new Error(
      "Gagal mendekripsi data - password salah atau file bukan backup WarungPOS",
    );
  }
}
