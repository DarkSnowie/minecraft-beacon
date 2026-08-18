/**
 * pages/dashboard.js
 * -----------------------------------------------------------------------
 * The Dashboard page: renders achievement stats, recent activity, and
 * quick-navigation cards into a container element (app.js passes #content
 * after building the shared page header).
 *
 * Data note (Milestone 2 scope): the Achievement Tracker does not exist
 * yet, so there is no real source of "completed achievements" data. This
 * module reads/writes a small LocalStorage schema —
 * "achievements:completed" (array of {id, name, completedAt}) — that a
 * future Achievement Tracker milestone will populate for real. On first
 * run only, this module seeds a few CLEARLY LABELED mock entries so
 * Recent Activity has something meaningful to render; once seeded, it
 * never overwrites real data. The read/render logic below does not need
 * to change when real tracking is implemented — only the seeding step
 * will be removed.
 *
 * TOTAL_ACHIEVEMENTS is a mock constant (matching the figure from the
 * original static markup) until data/achievements.json is populated in
 * a future Data Layer milestone — see roadmap notes.
 * -----------------------------------------------------------------------
 */

import { createElement } from '../assets/js/ui.js';
import { createCard } from '../components/card.js';
import { createProgressBar } from '../components/progressbar.js';
import * as storage from '../assets/js/storage.js';
import { navigate } from '../assets/js/router.js';

// TODO: replace with real data from data/achievements.json once that
// file is populated (Data Layer milestone). Value matches the figure
// already used in the project's original static markup.
const TOTAL_ACHIEVEMENTS = 133;

const COMPLETED_KEY = 'achievements:completed';
const SEEDED_KEY = 'achievements:seeded';

const QUICK_NAV_DESTINATIONS = [
  { route: 'achievements', title: 'Achievements', description: 'View and track your achievements.' },
  { route: 'farms', title: 'Farms', description: 'Plan and manage your farm builds.' },
  { route: 'collections', title: 'Collections', description: 'Track items you have collected.' },
  { route: 'notes', title: 'Notes', description: 'Review your personal notes.' },
];

/**
 * Builds a small set of clearly-labeled MOCK "recently completed"
 * entries, spread across the last few days, so Recent Activity has
 * something to display before a real Achievement Tracker exists.
 * @returns {{id: string, name: string, completedAt: string}[]}
 */
function buildMockSeedActivity() {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  return [
    { id: 'mock-1', name: 'Sample Achievement A', completedAt: new Date(now - 3 * day).toISOString() },
    { id: 'mock-2', name: 'Sample Achievement B', completedAt: new Date(now - 1 * day).toISOString() },
    { id: 'mock-3', name: 'Sample Achievement C', completedAt: new Date(now).toISOString() },
  ];
}

/**
 * Seeds mock activity into storage exactly once. Safe to call on every
 * Dashboard render — it no-ops after the first successful seed.
 */
function seedMockActivityIfNeeded() {
  const alreadySeeded = storage.getItem(SEEDED_KEY, false);
  if (alreadySeeded) return;

  storage.setItem(COMPLETED_KEY, buildMockSeedActivity());
  storage.setItem(SEEDED_KEY, true);
}

/**
 * Reads the current list of completed achievements from storage.
 * @returns {{id: string, name: string, completedAt: string}[]}
 */
function getCompletedAchievements() {
  return storage.getItem(COMPLETED_KEY, []);
}

/**
 * Formats an ISO date string as a short relative-time label.
 * @param {string} isoString
 * @returns {string}
 */
function formatRelativeTime(isoString) {
  const date = new Date(isoString);
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

/**
 * Builds the Recent Activity card, listing up to the 5 most recently
 * completed achievements, or a friendly empty-state message.
 * @param {{id: string, name: string, completedAt: string}[]} completed
 * @returns {HTMLElement}
 */
function buildRecentActivityCard(completed) {
  const list = createElement('ul');

  const recent = [...completed]
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .slice(0, 5);

  if (recent.length === 0) {
    list.appendChild(createElement('li', { text: 'No activity yet.' }));
  } else {
    recent.forEach((entry) => {
      list.appendChild(createElement('li', {
        text: `${entry.name} — ${formatRelativeTime(entry.completedAt)}`,
      }));
    });
  }

  return createCard({
    id: 'recent-activity',
    title: 'Recent Activity',
    content: list,
  });
}

/**
 * Builds the stats row: Total Achievements, Completed, Completion %
 * (with a progress bar), and Recent Activity.
 * @returns {HTMLElement}
 */
function buildStatsSection() {
  const completed = getCompletedAchievements();
  const completedCount = completed.length;
  const percentage = TOTAL_ACHIEVEMENTS > 0
    ? Math.round((completedCount / TOTAL_ACHIEVEMENTS) * 100)
    : 0;

  const grid = createElement('div', { className: 'dashboard-grid' });

  const totalCard = createCard({
    id: 'stat-total',
    title: 'Total Achievements',
    content: String(TOTAL_ACHIEVEMENTS),
  });

  const completedCard = createCard({
    id: 'stat-completed',
    title: 'Completed',
    content: String(completedCount),
  });

  const progressBar = createProgressBar({
    value: completedCount,
    max: TOTAL_ACHIEVEMENTS,
    labelId: 'stat-percentage-heading',
  });

  const percentageWrapper = createElement('div');
  percentageWrapper.appendChild(createElement('p', {
    text: `${completedCount}/${TOTAL_ACHIEVEMENTS} achievements (${percentage}%)`,
  }));
  percentageWrapper.appendChild(progressBar);

  const percentageCard = createCard({
    id: 'stat-percentage',
    title: 'Completion',
    content: percentageWrapper,
  });

  const activityCard = buildRecentActivityCard(completed);

  grid.appendChild(totalCard);
  grid.appendChild(completedCard);
  grid.appendChild(percentageCard);
  grid.appendChild(activityCard);

  return grid;
}

/**
 * Builds the Quick Navigation section: a labelled group of clickable
 * cards that route to the other pages via the app's router.
 * @returns {HTMLElement}
 */
function buildQuickNavSection() {
  const section = createElement('section', {
    attrs: { 'aria-labelledby': 'quicknav-heading' },
  });

  section.appendChild(createElement('h3', {
    attrs: { id: 'quicknav-heading' },
    text: 'Quick Navigation',
  }));

  const grid = createElement('div', { className: 'dashboard-grid' });

  QUICK_NAV_DESTINATIONS.forEach(({ route, title, description }) => {
    grid.appendChild(createCard({
      id: `quicknav-${route}`,
      title,
      content: description,
      onClick: () => navigate(route),
    }));
  });

  section.appendChild(grid);

  return section;
}

/**
 * Renders the full Dashboard page into the given container. The caller
 * (app.js) is responsible for clearing the container and building the
 * shared page header before calling this.
 * @param {Element|null} container
 */
export function renderDashboard(container) {
  if (!container) return;

  seedMockActivityIfNeeded();

  container.appendChild(buildStatsSection());
  container.appendChild(buildQuickNavSection());
}
