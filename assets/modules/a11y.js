/**
 * a11y.js
 * Native ES module for modal dialog accessibility, focus trapping, and focus restoration.
 * Zero external dependencies. Conforms to W3C WAI-ARIA Authoring Practices (APG) for Modal Dialogs.
 */

/**
 * Returns focusable, interactive elements within a container.
 * Filters out disabled elements and elements hidden from tab order.
 *
 * @param {HTMLElement} container
 * @param {Document} [doc]
 * @returns {Array<HTMLElement>}
 */
export function getFocusableElements(container, doc = (typeof document !== 'undefined' ? document : null)) {
  if (!container || typeof container.querySelectorAll !== 'function') return [];
  const activeEl = doc ? doc.activeElement : null;
  const selector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const elements = Array.from(container.querySelectorAll(selector));
  return elements.filter((el) => {
    if (el.disabled) return false;
    if (el.getAttribute && el.getAttribute('tabindex') === '-1') return false;
    // In browser: check offsetParent if available; in headless/mock: accept elements
    if (typeof el.offsetParent !== 'undefined' && el.offsetParent === null && el !== activeEl) {
      return false;
    }
    return true;
  });
}

/**
 * Traps Tab and Shift+Tab key navigation strictly within modalContainer.
 * Handles:
 * 1. Boundary wrapping:
 *    - Tab at last focusable element wraps to first focusable element.
 *    - Shift+Tab at first focusable element wraps to last focusable element.
 * 2. External focus containment (focus never escapes the active modal):
 *    - If focus is outside modalContainer, Tab redirects to first focusable element.
 *    - If focus is outside modalContainer, Shift+Tab redirects to last focusable element.
 *
 * @param {KeyboardEvent} e
 * @param {HTMLElement} modalContainer
 * @param {Document} [doc]
 * @returns {boolean} True if navigation was trapped / handled
 */
export function trapFocusInModal(e, modalContainer, doc = (typeof document !== 'undefined' ? document : null)) {
  if (!e || e.key !== 'Tab') return false;
  if (!modalContainer) return false;

  const currentDoc = doc || (typeof document !== 'undefined' ? document : null);
  const activeEl = currentDoc ? currentDoc.activeElement : null;
  const focusables = getFocusableElements(modalContainer, currentDoc);

  if (!focusables.length) {
    if (typeof e.preventDefault === 'function') e.preventDefault();
    if (typeof modalContainer.focus === 'function') modalContainer.focus();
    return true;
  }

  const firstEl = focusables[0];
  const lastEl = focusables[focusables.length - 1];
  const isOutside = !modalContainer.contains || !activeEl || !modalContainer.contains(activeEl);

  if (e.shiftKey) {
    if (isOutside || activeEl === firstEl) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof lastEl.focus === 'function') lastEl.focus();
      return true;
    }
  } else {
    if (isOutside || activeEl === lastEl) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof firstEl.focus === 'function') firstEl.focus();
      return true;
    }
  }
  return false;
}
