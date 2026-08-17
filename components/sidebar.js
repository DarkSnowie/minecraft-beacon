/**
 * components/sidebar.js
 * -----------------------------------------------------------------------
 * Progressive enhancement for the existing static sidebar markup in
 * index.html (`<nav class="sidebar">` containing `[data-page]` buttons).
 * This module does not create any new DOM — it only binds behaviour to
 * elements that already exist, and keeps their active/aria-current
 * state in sync with whatever route the app tells it is active.
 * -----------------------------------------------------------------------
 */

import { qsa } from '../assets/js/ui.js';

let onNavigateCallback = null;

/**
 * @param {MouseEvent} event
 */
function handleButtonClick(event) {
  const button = event.currentTarget;
  const page = button.dataset.page;

  if (!page) return;

  if (typeof onNavigateCallback === 'function') {
    onNavigateCallback(page);
  }
}

/**
 * Binds click handlers to every existing `.sidebar [data-page]` button.
 *
 * @param {Object} options
 * @param {(routeName: string) => void} [options.onNavigate] Called with
 *   the route name whenever a nav button is clicked. The sidebar itself
 *   has no knowledge of routing — the caller (app.js) decides what to
 *   do, keeping this component reusable and decoupled from the router.
 * @returns {{ destroy: () => void }}
 */
export function initSidebar({ onNavigate } = {}) {
  onNavigateCallback = onNavigate || null;

  const buttons = qsa('.sidebar [data-page]');

  buttons.forEach((button) => {
    button.addEventListener('click', handleButtonClick);
  });

  return {
    destroy() {
      buttons.forEach((button) => {
        button.removeEventListener('click', handleButtonClick);
      });
    },
  };
}

/**
 * Synchronizes the sidebar's visual active state and aria-current
 * attribute with the given route name.
 * @param {string} routeName
 */
export function setActive(routeName) {
  const buttons = qsa('.sidebar [data-page]');

  buttons.forEach((button) => {
    const isActive = button.dataset.page === routeName;
    button.classList.toggle('active', isActive);

    if (isActive) {
      button.setAttribute('aria-current', 'page');
    } else {
      button.removeAttribute('aria-current');
    }
  });
}
