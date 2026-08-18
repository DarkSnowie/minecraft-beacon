/**
 * components/card.js
 * -----------------------------------------------------------------------
 * Factory for DOM nodes that match the existing `.card` styling already
 * defined in assets/css/components.css. No CSS changes were needed —
 * this reuses the same class names and heading/labelling pattern already
 * present in index.html's static dashboard card.
 * -----------------------------------------------------------------------
 */

import { createElement } from '../assets/js/ui.js';

/**
 * Builds a `<section class="card">` element with an optional heading
 * and body content, wired up with matching aria-labelledby/id pairs
 * for accessibility (mirroring the pattern already used by the
 * dashboard's progress card in index.html).
 *
 * @param {Object} options
 * @param {string} [options.title] Heading text. Rendered as an <h3>.
 * @param {string} [options.id] Base id used to generate a unique
 *   heading id (`${id}-heading`) and set on the card itself.
 * @param {string|Node} [options.content] Body content. Strings are
 *   wrapped in a <p>; DOM nodes are appended as-is.
 * @param {(event: Event) => void} [options.onClick] When provided, the
 *   card becomes interactive: it gets role="button", is keyboard
 *   focusable (tabindex="0"), responds to Enter/Space as well as
 *   click, and shows a pointer cursor. Omit for purely informational
 *   cards (existing callers that don't pass this are unaffected).
 * @returns {HTMLElement}
 */
export function createCard({ title, id, content, onClick } = {}) {
  const card = createElement('section', {
    className: 'card',
    attrs: id ? { id } : undefined,
  });

  if (title) {
    const headingId = id ? `${id}-heading` : undefined;

    const heading = createElement('h3', {
      text: title,
      attrs: headingId ? { id: headingId } : undefined,
    });

    card.appendChild(heading);

    if (headingId) {
      card.setAttribute('aria-labelledby', headingId);
    }
  }

  if (content instanceof Node) {
    card.appendChild(content);
  } else if (typeof content === 'string' && content.length > 0) {
    card.appendChild(createElement('p', { text: content }));
  }

  if (typeof onClick === 'function') {
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.style.cursor = 'pointer';

    card.addEventListener('click', onClick);
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onClick(event);
      }
    });
  }

  return card;
}
