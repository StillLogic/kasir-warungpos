export function toTitleCase(str: string): string {
  if (!str) return str;

  return str
    .split(" ")
    .map((word) => {
      if (!word) return word;

      // Jika kata ini semua uppercase (misal: ELEKTRONIK), pertahankan
      const isAllUpperCase = word === word.toUpperCase() && /[A-Z]/.test(word);

      if (isAllUpperCase) {
        return word; // Pertahankan kata uppercase
      }

      // Jika tidak, konversi ke Title Case (huruf pertama besar)
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

export function toUpperCase(str: string): string {
  if (!str) return str;
  return str.toUpperCase();
}

export function handleTitleCaseChange(
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  setter: (value: string) => void,
) {
  const cursorPosition = e.target.selectionStart || 0;
  const newValue = toTitleCase(e.target.value);
  setter(newValue);

  setTimeout(() => {
    e.target.setSelectionRange(cursorPosition, cursorPosition);
  }, 0);
}

export function handleUpperCaseChange(
  e: React.ChangeEvent<HTMLInputElement>,
  setter: (value: string) => void,
) {
  const cursorPosition = e.target.selectionStart || 0;
  const newValue = toUpperCase(e.target.value);
  setter(newValue);

  setTimeout(() => {
    e.target.setSelectionRange(cursorPosition, cursorPosition);
  }, 0);
}

export function formatPhoneNumber(phone: string): string {
  if (!phone) return phone;

  let cleaned = phone.replace(/[^\d+]/g, "");

  // Remove leading + for processing
  const withoutPlus = cleaned.startsWith("+") ? cleaned.substring(1) : cleaned;

  if (!withoutPlus) return "";

  // Already has +62
  if (cleaned.startsWith("+62")) {
    return cleaned;
  }
  // Starts with 62 (without +)
  if (withoutPlus.startsWith("62")) {
    return "+" + withoutPlus;
  }
  // Starts with 0 (Indonesian format)
  if (withoutPlus.startsWith("0")) {
    return "+62" + withoutPlus.substring(1);
  }
  // Starts with 8 (common Indonesian mobile)
  if (withoutPlus.startsWith("8")) {
    return "+62" + withoutPlus;
  }
  // Any other random numbers - prepend +62
  return "+62" + withoutPlus;
}

export function handlePhoneChange(
  e: React.ChangeEvent<HTMLInputElement>,
  setter: (value: string) => void,
) {
  const value = e.target.value;
  const cleaned = value.replace(/[^\d+\-\s]/g, "");
  setter(cleaned);
}

export function handlePhoneBlur(
  value: string,
  setter: (value: string) => void,
) {
  if (value.trim()) {
    setter(formatPhoneNumber(value));
  }
}
