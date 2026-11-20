/**
 * format.js
 * Native ES module for formatting dates, durations, and relative times.
 * Zero external dependencies. Works in browsers and Node.js.
 */

/**
 * Returns HH:MM:SS string for current local time.
 */
export function nowTime() {
  return new Date().toTimeString().slice(0, 8);
}

/**
 * Calculates elapsed minutes since an ISO 8601 date string.
 * Returns null if the date is invalid or unparseable.
 *
 * @param {string} isoStr
 * @returns {number|null}
 */
export function minutesSinceIso(isoStr) {
  if (!isoStr || typeof isoStr !== 'string') return null;
  const d = new Date(isoStr);
  const time = d.getTime();
  if (Number.isNaN(time)) return null;
  const elapsedMs = Date.now() - time;
  return Math.max(0, Math.floor(elapsedMs / (1000 * 60)));
}

/**
 * Formats elapsed minutes into human-readable Arabic or English duration.
 *
 * @param {number|null|undefined} minutes
 * @param {boolean} isArabic
 * @returns {string}
 */
export function formatWaitingDuration(minutes, isArabic = true) {
  if (minutes === null || minutes === undefined || Number.isNaN(Number(minutes))) {
    return isArabic ? 'تاريخ غير صالح ⚠️' : 'Invalid date ⚠️';
  }
  const m = Math.max(0, Number(minutes) || 0);
  if (m < 1) return isArabic ? 'الآن (أقل من دقيقة)' : 'Just now (<1m)';
  if (m === 1) return isArabic ? 'منذ دقيقة واحدة' : '1 minute ago';
  if (m === 2) return isArabic ? 'منذ دقيقتين' : '2 minutes ago';
  if (m < 11) return isArabic ? `منذ ${m} دقائق` : `${m} minutes ago`;
  if (m < 60) return isArabic ? `منذ ${m} دقيقة` : `${m} minutes ago`;

  const hours = Math.floor(m / 60);
  const rem = m % 60;
  if (hours === 1) {
    return isArabic
      ? `منذ ساعة${rem ? ' و' + rem + ' دقيقة' : ''}`
      : `1h ${rem ? rem + 'm' : ''} ago`;
  }
  if (hours === 2) {
    return isArabic
      ? `منذ ساعتين${rem ? ' و' + rem + ' دقيقة' : ''}`
      : `2h ${rem ? rem + 'm' : ''} ago`;
  }
  if (hours < 24) {
    return isArabic
      ? `منذ ${hours} ساعات${rem ? ' و' + rem + ' دقيقة' : ''}`
      : `${hours}h ${rem ? rem + 'm' : ''} ago`;
  }

  const days = Math.floor(hours / 24);
  const remH = hours % 24;
  return isArabic
    ? `منذ ${days} ${days === 1 ? 'يوم' : days === 2 ? 'يومين' : 'أيام'}${remH ? ' و' + remH + ' س' : ''}`
    : `${days}d ago`;
}
