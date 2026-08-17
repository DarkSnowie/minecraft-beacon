/**
 * router.js
 * -----------------------------------------------------------------------
 * A minimal hash-based router.
 *
 * Hash routing is used deliberately: the fragment portion of a URL
 * (everything after "#") never gets sent to the server, so this works
 * identically whether Minecraft Beacon is hosted at a domain root or a
 * GitHub Pages subpath (e.g. "username.github.io/Minecraft-Beacon/").
 * No server-side rewrite rules are required, and there is no risk of a
 * 404 on refresh/deep-link, which a History-API-based router would
 * otherwise need extra GitHub Pages configuration to handle.
 *
 * This module has no knowledge of pages, DOM, or app-specific data. It
 * only maps a route name to a registered handler function.
 * -----------------------------------------------------------------------
 */

const routes = new Map();
let currentRoute = null;
let defaultRouteName = null;
let started = false;

/**
 * Reads the current route name out of window.location.hash, stripping
 * the leading "#" and an optional leading "/" so "#dashboard" and
 * "#/dashboard" both resolve to "dashboard".
 * @returns {string|null}
 */
function readRouteFromHash() {
  const raw = window.location.hash.replace(/^#\/?/, '');
  return raw || null;
}

/**
 * Resolves a requested route name to a valid, registered route name,
 * falling back to the configured default route if the requested one
 * is missing or unknown.
 * @param {string|null} name
 * @returns {string|null}
 */
function resolveRoute(name) {
  if (name && routes.has(name)) {
    return name;
  }
  return defaultRouteName;
}

/**
 * Handles a hashchange event (or a manual re-invocation when the hash
 * did not actually change) by resolving and dispatching to the
 * appropriate registered route handler.
 */
function handleHashChange() {
  const requested = readRouteFromHash();
  const resolved = resolveRoute(requested);

  if (!resolved) {
    return;
  }

  currentRoute = resolved;
  const handler = routes.get(resolved);

  if (typeof handler === 'function') {
    handler(resolved);
  }
}

/**
 * Registers a handler function for a named route.
 * @param {string} name
 * @param {(routeName: string) => void} handler
 */
export function registerRoute(name, handler) {
  if (typeof name !== 'string' || !name) {
    throw new Error('[router] registerRoute requires a non-empty string name.');
  }
  if (typeof handler !== 'function') {
    throw new Error('[router] registerRoute requires a handler function.');
  }
  routes.set(name, handler);
}

/**
 * Navigates to a registered route by updating window.location.hash.
 * If the requested route is already the current hash, the handler is
 * invoked directly (since no "hashchange" event would otherwise fire).
 * @param {string} name
 */
export function navigate(name) {
  if (!routes.has(name)) {
    console.warn(`[router] Cannot navigate to unknown route "${name}".`);
    return;
  }

  const targetHash = `#${name}`;

  if (window.location.hash === targetHash) {
    handleHashChange();
    return;
  }

  window.location.hash = targetHash;
}

/**
 * Starts the router: attaches the hashchange listener and resolves
 * the initial route from the current URL (or seeds the URL with the
 * supplied default route if no hash is present yet).
 * @param {string} defaultRoute A route name that has already been
 *   registered via registerRoute().
 */
export function init(defaultRoute) {
  if (started) {
    console.warn('[router] init() called more than once. Ignoring subsequent call.');
    return;
  }

  if (typeof defaultRoute !== 'string' || !routes.has(defaultRoute)) {
    throw new Error('[router] init() requires a valid default route that has already been registered.');
  }

  defaultRouteName = defaultRoute;
  started = true;

  window.addEventListener('hashchange', handleHashChange);

  const initialRoute = readRouteFromHash();

  if (initialRoute && routes.has(initialRoute)) {
    if (window.location.hash !== `#${initialRoute}`) {
      // Normalize non-canonical hash forms (e.g. "#/dashboard" -> "#dashboard").
      window.location.hash = `#${initialRoute}`;
    } else {
      handleHashChange();
    }
  } else {
    // No hash yet (or an unknown one) — seed the URL with the default route.
    // This assignment triggers a "hashchange" event, which the listener
    // attached above will catch, so the handler fires exactly once.
    window.location.hash = `#${defaultRoute}`;
  }
}

/**
 * Returns the name of the currently active route, or null if the
 * router has not resolved a route yet.
 * @returns {string|null}
 */
export function getCurrentRoute() {
  return currentRoute;
}
