/**
 * app.js
 * -----------------------------------------------------------------------
 * Application entry point, loaded as an ES module from index.html. This
 * is the only file that wires storage, router, ui, and the components
 * together — none of those modules import each other or this file
 * directly, keeping the dependency graph a flat, cycle-free tree.
 *
 * Scope note (Milestone 2): the "dashboard" route now renders the real
 * Dashboard page (pages/dashboard.js) instead of reattaching the
 * original static markup. All other routes still render lightweight
 * placeholder content — the Achievement Tracker and other features are
 * not implemented yet.
 * -----------------------------------------------------------------------
 */

import * as storage from './storage.js';
import * as router from './router.js';
import { qs, clearChildren, createElement } from './ui.js';
import { initSidebar, setActive } from '../../components/sidebar.js';
import { createCard } from '../../components/card.js';
import { renderDashboard } from '../../pages/dashboard.js';

const LAST_ROUTE_KEY = 'lastRoute';

/**
 * Per-route title/subtitle/placeholder copy. Every route renders its
 * own header (h2#title + subtitle) fresh on each navigation — this is
 * intentional so `#title` always exists after a render, even though it
 * lives inside `#content` (the same element we clear/rebuild per route).
 */
const ROUTE_META = {
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Your Minecraft Bedrock progress at a glance.',
  },
  achievements: {
    title: 'Achievements',
    subtitle: 'Track your Bedrock achievement completion.',
    placeholderMessage: 'Achievement tracking is coming in a future milestone.',
  },
  farms: {
    title: 'Farms',
    subtitle: 'Plan and track your Bedrock farm builds.',
    placeholderMessage: 'The farm planner is coming in a future milestone.',
  },
  collections: {
    title: 'Collections',
    subtitle: 'Track items and blocks you have collected.',
    placeholderMessage: 'The collection tracker is coming in a future milestone.',
  },
  notes: {
    title: 'Notes',
    subtitle: 'Keep personal notes about your worlds and progress.',
    placeholderMessage: 'Notes are coming in a future milestone.',
  },
};

/**
 * Renders the given route into #content: a freshly-built page header
 * (title + subtitle), followed by either the real Dashboard page (for
 * the "dashboard" route) or a placeholder card (for every other route).
 * @param {string} routeName
 * @param {{title: string, subtitle?: string, placeholderMessage?: string}} meta
 */
function renderRoute(routeName, meta) {
  const content = qs('#content');
  if (!content) return;

  clearChildren(content);

  const header = createElement('header');
  header.appendChild(createElement('h2', { attrs: { id: 'title' }, text: meta.title }));

  if (meta.subtitle) {
    header.appendChild(createElement('p', { text: meta.subtitle }));
  }

  content.appendChild(header);

  if (routeName === 'dashboard') {
    renderDashboard(content);
    return;
  }

  const card = createCard({
    id: `${routeName}-placeholder`,
    title: meta.title,
    content: meta.placeholderMessage,
  });

  content.appendChild(card);
}

/**
 * Route handler shared by every registered route: renders the route's
 * content, syncs the sidebar's active state, and persists the route as
 * the "last visited" page.
 * @param {string} routeName
 */
function handleRouteChange(routeName) {
  const meta = ROUTE_META[routeName];
  if (!meta) return;

  renderRoute(routeName, meta);
  setActive(routeName);
  storage.setItem(LAST_ROUTE_KEY, routeName);
}

/**
 * Registers every route defined in ROUTE_META with the router.
 */
function registerRoutes() {
  Object.keys(ROUTE_META).forEach((routeName) => {
    router.registerRoute(routeName, handleRouteChange);
  });
}

/**
 * Resolves which route to start on: the last-visited route persisted
 * in storage (if it's still a valid, known route), otherwise "dashboard".
 * @returns {string}
 */
function resolveInitialRoute() {
  const savedRoute = storage.getItem(LAST_ROUTE_KEY, null);

  if (savedRoute && Object.prototype.hasOwnProperty.call(ROUTE_META, savedRoute)) {
    return savedRoute;
  }

  return 'dashboard';
}

/**
 * Wires up the application: registers routes, binds the sidebar, and
 * starts the router.
 */
function bootstrap() {
  registerRoutes();

  initSidebar({
    onNavigate: (routeName) => router.navigate(routeName),
  });

  const initialRoute = resolveInitialRoute();
  router.init(initialRoute);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
