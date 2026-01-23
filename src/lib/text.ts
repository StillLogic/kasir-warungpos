// Text transformation utilities

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
  
  // Restore cursor position after React re-render
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
  
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Handle different formats
  if (cleaned.startsWith('+62')) {
    // Already in correct format
    return cleaned;
  } else if (cleaned.startsWith('62')) {
    // Has 62 prefix but no +
    return '+' + cleaned;
  } else if (cleaned.startsWith('0')) {
    // Indonesian local format (08xxx)
    return '+62' + cleaned.substring(1);
  } else if (cleaned.startsWith('8')) {
    // Missing prefix entirely
    return '+62' + cleaned;
  }
  
  // Return as-is if doesn't match known patterns
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
  
  // Only allow digits, +, and common separators during typing
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
