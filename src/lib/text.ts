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
