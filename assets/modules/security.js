/**
 * security.js
 * Native ES module for URL sanitization, XSS prevention, and secret detection.
 * Zero external dependencies. Works in modern browsers (ESM) and Node.js 22+.
 */

/**
 * Validates and sanitizes a URL string.
 * Strictly permits only http: and https: protocols via the standard URL parser.
 * Rejects javascript:, data:, vbscript:, and malformed URIs.
 *
 * @param {string|null|undefined} url
 * @returns {string} Sanitized URL string or empty string if invalid/unsafe
 */
export function sanitizeUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return '';
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.href;
    }
    return '';
  } catch {
    return '';
  }
}

/**
 * Checks whether a URL string is safe (http/https only).
 *
 * @param {string|null|undefined} url
 * @returns {boolean}
 */
export function isValidSafeUrl(url) {
  return sanitizeUrl(url) !== '';
}

/**
 * Escapes special HTML characters to prevent XSS injection.
 *
 * @param {string|null|undefined} str
 * @returns {string}
 */
export function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Produces a safe href attribute value.
 * If the URL is safe, returns its escaped form; otherwise returns fallback.
 *
 * @param {string|null|undefined} url
 * @param {string} fallback
 * @returns {string}
 */
export function safeLinkHref(url, fallback = '#') {
  const safe = sanitizeUrl(url);
  return safe ? escapeHtml(safe) : fallback;
}
