/**
 * Utility functions for Russian date formatting and general helper utilities
 */

/**
 * Converts a standard ISO date string (YYYY-MM-DD) into Russian human-readable format DD.MM.YYYY
 * @param dateStr Date string in "YYYY-MM-DD" or similar format
 */
export function formatDateToRu(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  // If the format is already DD.MM.YYYY, return as is
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Extract parts from YYYY-MM-DD
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, year, month, day] = match;
    return `${day}.${month}.${year}`;
  }
  
  return dateStr;
}

/**
 * Normalizes input date back to YYYY-MM-DD for form input values
 */
export function normalizeDateToInput(dateStr: string | undefined | null): string {
  if (!dateStr) {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  const match = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month}-${day}`;
  }
  return dateStr;
}

/**
 * File downloader helper for JSON objects
 */
export function downloadJsonFile(obj: Record<string, any>, filename: string) {
  const jsonStr = JSON.stringify(obj, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
