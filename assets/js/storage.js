/**
 * storage.js
 * -----------------------------------------------------------------------
 * A safe abstraction over the browser's localStorage API for Minecraft
 * Beacon. All persisted application data should go through this module
 * rather than touching `window.localStorage` directly, so that:
 *
 *   - Keys are namespaced ("mcbeacon:") to avoid collisions with other
 *     scripts/apps that might share the same origin.
 *   - Values are transparently JSON-serialized/deserialized.
 *   - Failures (private browsing, quota exceeded, storage disabled) are
 *     caught and degrade gracefully instead of throwing and breaking
 *     the app.
 * -----------------------------------------------------------------------
 */

const NAMESPACE = 'mcbeacon';

/**
 * Builds the fully-namespaced key used in the underlying localStorage.
 * @param {string} key
 * @returns {string}
 */
function buildKey(key) {
  return `${NAMESPACE}:${key}`;
}

/**
 * Detects whether localStorage is actually usable in the current
 * environment (it can exist but still throw, e.g. in some private
 * browsing modes or when storage quota is exhausted).
 * @returns {boolean}
 */
function detectStorageAvailability() {
  try {
    const testKey = `${NAMESPACE}:__availability_test__`;
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
}

const STORAGE_AVAILABLE = detectStorageAvailability();

/**
 * Checks whether a value exists for the given key.
 * @param {string} key
 * @returns {boolean}
 */
export function hasItem(key) {
  if (!STORAGE_AVAILABLE) {
    return false;
  }
  return window.localStorage.getItem(buildKey(key)) !== null;
}

/**
 * Retrieves and JSON-parses a stored value.
 * @param {string} key
 * @param {*} [fallback=null] Value to return if the key is missing or
 *   the stored value cannot be parsed.
 * @returns {*}
 */
export function getItem(key, fallback = null) {
  if (!STORAGE_AVAILABLE) {
    return fallback;
  }

  const raw = window.localStorage.getItem(buildKey(key));

  if (raw === null) {
    return fallback;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`[storage] Failed to parse stored value for "${key}". Returning fallback.`, error);
    return fallback;
  }
}

/**
 * JSON-serializes and stores a value.
 * @param {string} key
 * @param {*} value
 * @returns {boolean} True if the value was successfully persisted.
 */
export function setItem(key, value) {
  if (!STORAGE_AVAILABLE) {
    console.warn(`[storage] localStorage is unavailable. Value for "${key}" was not persisted.`);
    return false;
  }

  try {
    window.localStorage.setItem(buildKey(key), JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`[storage] Failed to persist value for "${key}".`, error);
    return false;
  }
}

/**
 * Removes a single stored value.
 * @param {string} key
 * @returns {boolean} True if the operation completed without error.
 */
export function removeItem(key) {
  if (!STORAGE_AVAILABLE) {
    return false;
  }

  try {
    window.localStorage.removeItem(buildKey(key));
    return true;
  } catch (error) {
    console.warn(`[storage] Failed to remove value for "${key}".`, error);
    return false;
  }
}

/**
 * Removes every value stored under this app's namespace, without
 * touching unrelated localStorage keys from other scripts/apps that
 * might share the same origin.
 * @returns {boolean} True if the operation completed without error.
 */
export function clear() {
  if (!STORAGE_AVAILABLE) {
    return false;
  }

  try {
    const keysToRemove = [];

    for (let i = 0; i < window.localStorage.length; i += 1) {
      const storedKey = window.localStorage.key(i);
      if (storedKey && storedKey.startsWith(`${NAMESPACE}:`)) {
        keysToRemove.push(storedKey);
      }
    }

    keysToRemove.forEach((storedKey) => window.localStorage.removeItem(storedKey));
    return true;
  } catch (error) {
    console.warn('[storage] Failed to clear namespaced storage.', error);
    return false;
  }
}

/**
 * Reports whether localStorage is usable in this environment. Useful
 * for features (e.g. Settings) that may want to warn the user if
 * their progress cannot be saved.
 * @returns {boolean}
 */
export function isAvailable() {
  return STORAGE_AVAILABLE;
}
