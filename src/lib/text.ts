export function toTitleCase(str: string): string {
  if (!str) return str;
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
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

  if (cleaned.startsWith("+62")) {
    return cleaned;
  } else if (cleaned.startsWith("62")) {
    return "+" + cleaned;
  } else if (cleaned.startsWith("0")) {
    return "+62" + cleaned.substring(1);
  } else if (cleaned.startsWith("8")) {
    return "+62" + cleaned;
  }

  return cleaned;
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
