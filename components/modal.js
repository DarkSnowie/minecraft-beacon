/**
 * components/modal.js
 * -----------------------------------------------------------------------
 * Reusable modal dialog factory.
 *
 * No dedicated CSS classes exist yet for modals (out of scope for this
 * milestone — no CSS files were touched). Layout/visual styling is
 * therefore applied inline here as a deliberate, scoped stopgap, reusing
 * the app's existing CSS custom properties (--bg-card, --radius-large,
 * etc.) so it still matches the dark theme. This should be migrated to
 * proper CSS classes in components.css once a real feature (e.g. Notes
 * editing, Import/Export confirmation) actually wires a modal into the
 * UI — see README/roadmap notes for tracking.
 *
 * Not yet consumed by any page in this milestone.
 * -----------------------------------------------------------------------
 */

import { createElement } from '../assets/js/ui.js';

/**
 * @param {HTMLElement} overlay
 */
function applyOverlayStyles(overlay) {
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 0, 0, 0.6)',
    zIndex: '1000',
  });
}

/**
 * @param {HTMLElement} panel
 */
function applyPanelStyles(panel) {
  Object.assign(panel.style, {
    background: 'var(--bg-card, #2a2e31)',
    color: 'var(--text-primary, #f5f5f5)',
    borderRadius: 'var(--radius-large, 20px)',
    boxShadow: 'var(--shadow, 0 12px 28px rgba(0, 0, 0, 0.28))',
    padding: '1.5rem',
    maxWidth: '90vw',
    maxHeight: '85vh',
    overflowY: 'auto',
    minWidth: '280px',
  });
}

/**
 * @param {HTMLElement} closeButton
 */
function applyCloseButtonStyles(closeButton) {
  Object.assign(closeButton.style, {
    marginTop: '1rem',
    background: 'var(--accent-primary, #59c36a)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-medium, 14px)',
    padding: '.6rem 1rem',
    cursor: 'pointer',
  });
}

/**
 * Builds a modal dialog. The modal is not attached to the DOM until
 * `open()` is called, and removes itself from the DOM on `close()`.
 *
 * @param {Object} options
 * @param {string} [options.title]
 * @param {string|Node} [options.content]
 * @param {() => void} [options.onClose] Called after the modal closes,
 *   whether by the close button, overlay click, or Escape key.
 * @returns {{ element: HTMLElement, open: () => void, close: () => void }}
 */
export function createModal({ title, content, onClose } = {}) {
  const overlay = createElement('div', {
    className: 'modal-overlay',
    attrs: { role: 'presentation' },
  });
  applyOverlayStyles(overlay);

  const panel = createElement('div', {
    className: 'modal-panel',
    attrs: {
      role: 'dialog',
      'aria-modal': 'true',
      ...(title ? { 'aria-label': title } : {}),
    },
  });
  applyPanelStyles(panel);

  if (title) {
    panel.appendChild(createElement('h2', { text: title }));
  }

  if (content instanceof Node) {
    panel.appendChild(content);
  } else if (typeof content === 'string' && content.length > 0) {
    panel.appendChild(createElement('p', { text: content }));
  }

  const closeButton = createElement('button', {
    className: 'modal-close',
    text: 'Close',
    attrs: { type: 'button', 'aria-label': 'Close dialog' },
  });
  applyCloseButtonStyles(closeButton);
  panel.appendChild(closeButton);

  overlay.appendChild(panel);

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      close();
    }
  }

  function handleOverlayClick(event) {
    if (event.target === overlay) {
      close();
    }
  }

  function open() {
    document.body.appendChild(overlay);
    document.addEventListener('keydown', handleKeydown);
    closeButton.focus();
  }

  function close() {
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
    document.removeEventListener('keydown', handleKeydown);

    if (typeof onClose === 'function') {
      onClose();
    }
  }

  closeButton.addEventListener('click', close);
  overlay.addEventListener('click', handleOverlayClick);

  return {
    element: overlay,
    open,
    close,
  };
}
