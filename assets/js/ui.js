/**
 * ui.js
 * -----------------------------------------------------------------------
 * Small, reusable DOM helper functions shared across the app. Nothing
 * in this file knows about routes, pages, or app-specific data — it is
 * purely generic DOM plumbing used by router.js, components/*.js, and
 * app.js.
 * -----------------------------------------------------------------------
 */

/**
 * Shorthand for querySelector, optionally scoped to an element.
 * @param {string} selector
 * @param {ParentNode} [scope=document]
 * @returns {Element|null}
 */
export function qs(selector, scope = document) {
  return scope.querySelector(selector);
}

/**
 * Shorthand for querySelectorAll, returned as a real array (not a
 * NodeList) so callers can freely use array methods like forEach/map.
 * @param {string} selector
 * @param {ParentNode} [scope=document]
 * @returns {Element[]}
 */
export function qsa(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}

/**
 * Creates a DOM element with optional class name, text content,
 * attributes, and child nodes in a single call.
 *
 * @param {string} tag
 * @param {Object} [options]
 * @param {string} [options.className]
 * @param {string} [options.text]
 * @param {Object<string,string>} [options.attrs]
 * @param {Node[]} [options.children]
 * @returns {HTMLElement}
 */
export function createElement(tag, options = {}) {
  const element = document.createElement(tag);
  const { className, text, attrs, children } = options;

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  if (attrs) {
    Object.entries(attrs).forEach(([name, value]) => {
      if (value !== null && value !== undefined) {
        element.setAttribute(name, value);
      }
    });
  }

  if (children) {
    children.forEach((child) => {
      if (child) {
        element.appendChild(child);
      }
    });
  }

  return element;
}

/**
 * Safely sets the text content of an element (no-op if the element
 * doesn't exist).
 * @param {Element|null} element
 * @param {string} text
 */
export function setText(element, text) {
  if (!element) return;
  element.textContent = text;
}

/**
 * Removes all child nodes from an element.
 * @param {Element|null} element
 */
export function clearChildren(element) {
  if (!element) return;
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * Reveals an element by removing the shared `.hidden` utility class
 * (defined in assets/css/utilities.css).
 * @param {Element|null} element
 */
export function show(element) {
  if (!element) return;
  element.classList.remove('hidden');
}

/**
 * Hides an element by adding the shared `.hidden` utility class
 * (defined in assets/css/utilities.css).
 * @param {Element|null} element
 */
export function hide(element) {
  if (!element) return;
  element.classList.add('hidden');
}

/**
 * Toggles the `.hidden` utility class on an element.
 * @param {Element|null} element
 * @param {boolean} [force] If provided, forces shown (true) or hidden (false).
 */
export function toggle(element, force) {
  if (!element) return;
  element.classList.toggle('hidden', force === undefined ? undefined : !force);
}
