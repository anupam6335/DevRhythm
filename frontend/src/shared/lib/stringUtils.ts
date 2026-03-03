/**
 * Sanitizes input by removing potentially harmful characters.
 * Replaces <, >, ', ", & with their HTML entities.
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/**
 * Truncates a string to a specified length and appends '...' if longer.
 */
export const truncate = (str: string, length: number): string => {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
};

/**
 * Generates a random alphanumeric string of given length.
 */
export const generateRandomString = (length = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Converts a string to a URL-friendly slug.
 */
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // remove non-word chars (except spaces and hyphens)
    .replace(/[\s_-]+/g, '-') // replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // trim leading/trailing hyphens
};

/**
 * Capitalizes the first letter of a string.
 */
export const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Extracts initials from a name (max 2 characters).
 * Example: "John Doe" -> "JD"
 */
export const extractInitials = (name: string): string => {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Formats a number with K/M/B suffixes.
 * Example: 1234 -> "1.2K"
 */
export const formatNumber = (num: number): string => {
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + 'B';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return num.toString();
};

/**
 * Pluralizes a word based on count.
 * @param word - The singular form.
 * @param count - The count.
 * @param plural - Optional custom plural form.
 */
export const pluralize = (word: string, count: number, plural?: string): string => {
  if (count === 1) return word;
  return plural || word + 's';
};