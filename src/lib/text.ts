

/**
 * Capitalize first letter of each word (Title Case)
 * Example: "indomie goreng" → "Indomie Goreng"
 */
export function toTitleCase(str: string): string {
  if (!str) return str;
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Convert to uppercase
 * Example: "mkn" → "MKN"
 */
export function toUpperCase(str: string): string {
  if (!str) return str;
  return str.toUpperCase();
}

/**
 * Handle input change with Title Case transformation
 */
export function handleTitleCaseChange(
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  setter: (value: string) => void
) {
  const cursorPosition = e.target.selectionStart || 0;
  const newValue = toTitleCase(e.target.value);
  setter(newValue);
  
  
  setTimeout(() => {
    e.target.setSelectionRange(cursorPosition, cursorPosition);
  }, 0);
}

/**
 * Handle input change with Uppercase transformation
 */
export function handleUpperCaseChange(
  e: React.ChangeEvent<HTMLInputElement>,
  setter: (value: string) => void
) {
  const cursorPosition = e.target.selectionStart || 0;
  const newValue = toUpperCase(e.target.value);
  setter(newValue);
  
  setTimeout(() => {
    e.target.setSelectionRange(cursorPosition, cursorPosition);
  }, 0);
}

/**
 * Format Indonesian phone number to +62 format
 * Examples:
 * - "08123456789" → "+628123456789"
 * - "628123456789" → "+628123456789"
 * - "+628123456789" → "+628123456789"
 * - "8123456789" → "+628123456789"
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return phone;
  
  
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  
  if (cleaned.startsWith('+62')) {
    
    return cleaned;
  } else if (cleaned.startsWith('62')) {
    
    return '+' + cleaned;
  } else if (cleaned.startsWith('0')) {
    
    return '+62' + cleaned.substring(1);
  } else if (cleaned.startsWith('8')) {
    
    return '+62' + cleaned;
  }
  
  
  return cleaned;
}

/**
 * Handle phone input with auto-format to +62
 */
export function handlePhoneChange(
  e: React.ChangeEvent<HTMLInputElement>,
  setter: (value: string) => void
) {
  const value = e.target.value;
  
  
  const cleaned = value.replace(/[^\d+\-\s]/g, '');
  setter(cleaned);
}

/**
 * Format phone on blur (when user finishes typing)
 */
export function handlePhoneBlur(
  value: string,
  setter: (value: string) => void
) {
  if (value.trim()) {
    setter(formatPhoneNumber(value));
  }
}
