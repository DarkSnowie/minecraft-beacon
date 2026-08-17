/**
 * components/progressbar.js
 * -----------------------------------------------------------------------
 * Factory + update helper for progress bars, matching the existing
 * `.progress` / inner-bar-div structure and styling already defined in
 * assets/css/style.css and index.html's dashboard progress bar.
 *
 * Not yet consumed by any page in this milestone (no real progress data
 * exists until the Achievements feature is implemented), but built as a
 * complete, reusable component ready for that work.
 * -----------------------------------------------------------------------
 */

import { createElement } from '../assets/js/ui.js';

/**
 * Clamps a number between a min and max (inclusive).
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculates a whole-number percentage, guarding against a zero or
 * negative max (which would otherwise produce NaN/Infinity).
 * @param {number} value
 * @param {number} max
 * @returns {number}
 */
function calculatePercentage(value, max) {
  if (!max || max <= 0) return 0;
  return clamp(Math.round((value / max) * 100), 0, 100);
}

/**
 * Builds a `<div class="progress" role="progressbar">` element with an
 * inner fill div, matching index.html's existing progress bar markup.
 *
 * @param {Object} options
 * @param {number} [options.value=0] Current progress value.
 * @param {number} [options.max=100] Maximum progress value.
 * @param {string} [options.labelId] Id of an element that labels this
 *   progress bar, set as aria-labelledby (mirrors the pattern used by
 *   the dashboard's existing progress bar).
 * @returns {HTMLElement}
 */
export function createProgressBar({ value = 0, max = 100, labelId } = {}) {
  const track = createElement('div', {
    className: 'progress',
    attrs: {
      role: 'progressbar',
      'aria-valuemin': '0',
      'aria-valuemax': String(max),
      'aria-valuenow': String(value),
      ...(labelId ? { 'aria-labelledby': labelId } : {}),
    },
  });

  const bar = createElement('div');
  bar.style.width = `${calculatePercentage(value, max)}%`;

  track.appendChild(bar);

  return track;
}

/**
 * Updates an existing progress bar element (created by
 * createProgressBar, or matching the same markup shape) in place.
 *
 * @param {Element|null} trackElement The `.progress` container element.
 * @param {number} value New current value.
 * @param {number} [max] New maximum value. Defaults to the element's
 *   existing aria-valuemax, or 100 if that is missing/invalid.
 */
export function updateProgressBar(trackElement, value, max) {
  if (!trackElement) return;

  const bar = trackElement.firstElementChild;
  const resolvedMax = max !== undefined
    ? max
    : Number(trackElement.getAttribute('aria-valuemax')) || 100;

  const percentage = calculatePercentage(value, resolvedMax);

  trackElement.setAttribute('aria-valuenow', String(value));
  trackElement.setAttribute('aria-valuemax', String(resolvedMax));

  if (bar) {
    bar.style.width = `${percentage}%`;
  }
}
