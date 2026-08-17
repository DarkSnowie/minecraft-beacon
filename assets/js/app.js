/**
 * app.js
 * -----------------------------------------------------------------------
 * Application entry point, loaded as an ES module from index.html. This
 * is the only file that wires storage, router, ui, and the components
 * together — none of those modules import each other or this file
 * directly, keeping the dependency graph a flat, cycle-free tree.
 *
 * Scope note (Milestone 1): route handlers below render lightweight
 * placeholder content for achievements/farms/collections/notes, and
 * restore the Dashboard's original static markup unchanged. No real
 * feature logic (achievement data, farm tracking, etc.) is implemented
 * yet — that begins in later milestones.
 * -----------------------------------------------------------------------
 */

import * as storage from './storage.js';
import * as router from './router.js';
import { qs, clearChildren, createElement } from './ui.js';
import { initSidebar, setActive } from '../../components/sidebar.js';
import { createCard } from '../../components/card.js';

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
 * Reference to the ORIGINAL `.dashboard-grid` element already present
 * in index.html (the real progress card, with its existing #bar/#done
 * ids and ARIA attributes intact). Captured once at startup, before any
 * rendering has touched #content, then moved (not cloned) in and out of
 * #content as the user navigates to and from the dashboard — so the
 * exact original DOM node, unmodified, is what's always shown.
 * @type {Element|null}
 */
let dashboardBodyNode = null;

/**
 * Captures the original dashboard body markup before any route
 * rendering has occurred. Must run before registerRoutes()/router.init().
 */
function captureOriginalDashboardMarkup() {
  dashboardBodyNode = qs('.dashboard-grid');
}

/**
 * Renders the given route into #content: a freshly-built page header
 * (title + subtitle), followed by either the original dashboard body
 * (for the "dashboard" route) or a placeholder card (for every other
 * route).
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

  if (routeName === 'dashboard' && dashboardBodyNode) {
    content.appendChild(dashboardBodyNode);
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
 * Wires up the application: captures original markup, registers
 * routes, binds the sidebar, and starts the router.
 */
function bootstrap() {
  captureOriginalDashboardMarkup();
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
