/**
 * pages/achievements.js
 * -----------------------------------------------------------------------
 * The Achievement Tracker page: loads achievement data from
 * data/achievements.json, displays it grouped by category, and lets the
 * user mark achievements as completed. Completion state is persisted to
 * the SAME LocalStorage key Dashboard already reads
 * ("achievements:completed"), so Dashboard automatically reflects real
 * progress the next time it renders — no additional event/sync system
 * is needed given this app's re-render-on-navigate architecture.
 *
 * Data note: data/achievements.json currently ships with `status:
 * "placeholder"` and a set of clearly-labeled sample entries (see that
 * file's "note" field). This page surfaces that notice on-screen. Real
 * Bedrock achievement data has not been invented here — see the Data
 * Layer milestone in the roadmap for sourcing official data.
 * -----------------------------------------------------------------------
 */

import { createElement, clearChildren } from '../assets/js/ui.js';
import { createCard } from '../components/card.js';
import { createProgressBar } from '../components/progressbar.js';
import * as storage from '../assets/js/storage.js';

const DATA_URL = 'data/achievements.json';
const COMPLETED_KEY = 'achievements:completed';

const SORT_OPTIONS = [
  { value: 'name-asc', text: 'Name (A–Z)' },
  { value: 'name-desc', text: 'Name (Z–A)' },
  { value: 'category', text: 'Category' },
  { value: 'completed-first', text: 'Completed First' },
];

/** Full achievement list loaded from data/achievements.json for the current page visit. */
let cachedAchievements = [];
/** The dataset's placeholder note, or null if the dataset is marked as real/final. */
let placeholderNotice = null;

/** Current toolbar state. Persists for the session (not reset per visit) so a
 * user's search/filter/sort choices survive navigating away and back. */
let searchQuery = '';
let categoryFilter = 'all';
let sortMode = 'name-asc';

/**
 * Fetches and validates data/achievements.json.
 * @returns {Promise<{schemaVersion: number, status: string, note?: string, achievements: object[]}>}
 */
async function loadAchievementsData() {
  const response = await fetch(DATA_URL);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${DATA_URL}: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data || !Array.isArray(data.achievements)) {
    throw new Error(`Unexpected shape in ${DATA_URL}: missing an "achievements" array.`);
  }

  return data;
}

/**
 * Resets module state from freshly-loaded data.
 * @param {{status?: string, note?: string, achievements: object[]}} data
 */
function initializeState(data) {
  cachedAchievements = data.achievements;
  placeholderNotice = data.status === 'placeholder' ? (data.note || 'This dataset is a placeholder.') : null;
}

/**
 * Reads the current list of completed achievements from storage.
 * @returns {{id: string, name: string, completedAt: string}[]}
 */
function getCompletedEntries() {
  return storage.getItem(COMPLETED_KEY, []);
}

/**
 * @returns {Set<string>} Set of completed achievement ids, for fast lookups.
 */
function getCompletedIdSet() {
  return new Set(getCompletedEntries().map((entry) => entry.id));
}

/**
 * Marks an achievement completed or not, persisting the change to the
 * shared "achievements:completed" storage key that Dashboard also reads.
 * @param {{id: string, name: string}} achievement
 * @param {boolean} isCompleted
 */
function toggleCompletion(achievement, isCompleted) {
  const entries = getCompletedEntries();
  const withoutThis = entries.filter((entry) => entry.id !== achievement.id);

  if (isCompleted) {
    withoutThis.push({
      id: achievement.id,
      name: achievement.name,
      completedAt: new Date().toISOString(),
    });
  }

  storage.setItem(COMPLETED_KEY, withoutThis);
}

/**
 * Converts a category name into a safe id fragment for DOM ids.
 * @param {string} text
 * @returns {string}
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Applies the current category filter and search query to the full
 * achievement list.
 * @returns {object[]}
 */
function getFilteredAchievements() {
  const query = searchQuery.trim().toLowerCase();

  return cachedAchievements.filter((achievement) => {
    if (categoryFilter !== 'all' && achievement.category !== categoryFilter) {
      return false;
    }

    if (!query) {
      return true;
    }

    const haystack = `${achievement.name} ${achievement.description}`.toLowerCase();
    return haystack.includes(query);
  });
}

/**
 * Sorts a list of achievements according to the current sort mode.
 * @param {object[]} list
 * @param {Set<string>} completedIds
 * @returns {object[]}
 */
function sortAchievements(list, completedIds) {
  const sorted = [...list];

  switch (sortMode) {
    case 'name-desc':
      sorted.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'category':
      sorted.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
      break;
    case 'completed-first':
      sorted.sort((a, b) => {
        const aRank = completedIds.has(a.id) ? 0 : 1;
        const bRank = completedIds.has(b.id) ? 0 : 1;
        return aRank !== bRank ? aRank - bRank : a.name.localeCompare(b.name);
      });
      break;
    case 'name-asc':
    default:
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
  }

  return sorted;
}

/**
 * Groups an already filtered/sorted list of achievements by category,
 * preserving the order categories first appear in the list.
 * @param {object[]} list
 * @returns {Map<string, object[]>}
 */
function groupByCategory(list) {
  const groups = new Map();

  list.forEach((achievement) => {
    if (!groups.has(achievement.category)) {
      groups.set(achievement.category, []);
    }
    groups.get(achievement.category).push(achievement);
  });

  return groups;
}

/**
 * Builds the on-screen notice shown when the loaded dataset is a
 * placeholder (see data/achievements.json's "status"/"note" fields).
 * @param {string} note
 * @returns {HTMLElement}
 */
function buildPlaceholderNotice(note) {
  const notice = createElement('div', { attrs: { role: 'note' } });

  Object.assign(notice.style, {
    background: 'var(--bg-card, #2a2e31)',
    border: '1px solid var(--border, #3a3f42)',
    borderRadius: 'var(--radius-medium, 14px)',
    padding: '1rem',
    marginBottom: '1.5rem',
    color: 'var(--text-secondary, #B8C0C2)',
  });

  notice.appendChild(createElement('strong', { text: 'Placeholder Data' }));
  notice.appendChild(createElement('p', { text: note }));

  return notice;
}

/**
 * Builds a single achievement's list item: a checkbox plus name/description.
 * @param {{id: string, name: string, description: string}} achievement
 * @param {boolean} isCompleted
 * @param {() => void} onToggle Called after the completion state is persisted.
 * @returns {HTMLElement}
 */
function buildAchievementItem(achievement, isCompleted, onToggle) {
  const item = createElement('li');
  Object.assign(item.style, { display: 'flex', alignItems: 'flex-start', gap: '.75rem' });

  const checkboxId = `achievement-${achievement.id}`;
  const checkbox = createElement('input', {
    attrs: { type: 'checkbox', id: checkboxId },
  });
  checkbox.checked = isCompleted;
  checkbox.addEventListener('change', (event) => {
    toggleCompletion(achievement, event.target.checked);
    onToggle();
  });

  const textWrapper = createElement('div');
  const label = createElement('label', { attrs: { for: checkboxId } });
  label.appendChild(createElement('strong', { text: achievement.name }));
  textWrapper.appendChild(label);
  textWrapper.appendChild(createElement('p', { text: achievement.description }));

  item.appendChild(checkbox);
  item.appendChild(textWrapper);

  return item;
}

/**
 * Builds a category card containing a list of achievement items.
 * @param {string} category
 * @param {object[]} achievements
 * @param {Set<string>} completedIds
 * @param {() => void} onToggle
 * @returns {HTMLElement}
 */
function buildCategoryGroup(category, achievements, completedIds, onToggle) {
  const list = createElement('ul');
  Object.assign(list.style, {
    listStyle: 'none',
    padding: '0',
    margin: '0',
    display: 'flex',
    flexDirection: 'column',
    gap: '.75rem',
  });

  achievements.forEach((achievement) => {
    list.appendChild(buildAchievementItem(achievement, completedIds.has(achievement.id), onToggle));
  });

  return createCard({
    id: `category-${slugify(category)}`,
    title: category,
    content: list,
  });
}

/**
 * Builds the search/filter/sort toolbar. Built once per page visit and
 * never rebuilt on state change, so the search input never loses focus
 * while typing.
 * @param {() => void} onChange Called whenever a control's value changes.
 * @returns {HTMLElement}
 */
function buildToolbar(onChange) {
  const toolbar = createElement('div', { attrs: { id: 'achievements-toolbar' } });
  Object.assign(toolbar.style, { display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem' });

  const searchLabel = createElement('label', { text: 'Search' });
  const searchInput = createElement('input', {
    attrs: {
      type: 'search',
      id: 'achievements-search',
      placeholder: 'Search by name or description…',
      'aria-label': 'Search achievements',
    },
  });
  searchInput.value = searchQuery;
  searchInput.addEventListener('input', (event) => {
    searchQuery = event.target.value;
    onChange();
  });
  searchLabel.appendChild(searchInput);

  const categoryLabel = createElement('label', { text: 'Category' });
  const categorySelect = createElement('select', {
    attrs: { id: 'achievements-category-filter', 'aria-label': 'Filter by category' },
  });
  const categories = ['all', ...new Set(cachedAchievements.map((achievement) => achievement.category))];
  categories.forEach((category) => {
    categorySelect.appendChild(createElement('option', {
      text: category === 'all' ? 'All Categories' : category,
      attrs: { value: category },
    }));
  });
  categorySelect.value = categoryFilter;
  categorySelect.addEventListener('change', (event) => {
    categoryFilter = event.target.value;
    onChange();
  });
  categoryLabel.appendChild(categorySelect);

  const sortLabel = createElement('label', { text: 'Sort by' });
  const sortSelect = createElement('select', {
    attrs: { id: 'achievements-sort', 'aria-label': 'Sort achievements' },
  });
  SORT_OPTIONS.forEach(({ value, text }) => {
    sortSelect.appendChild(createElement('option', { text, attrs: { value } }));
  });
  sortSelect.value = sortMode;
  sortSelect.addEventListener('change', (event) => {
    sortMode = event.target.value;
    onChange();
  });
  sortLabel.appendChild(sortSelect);

  toolbar.appendChild(searchLabel);
  toolbar.appendChild(categoryLabel);
  toolbar.appendChild(sortLabel);

  return toolbar;
}

/**
 * Renders the completion summary (count + percentage + progress bar)
 * into the given section, replacing any previous content.
 * @param {Element} section
 */
function renderSummary(section) {
  clearChildren(section);

  const total = cachedAchievements.length;
  const completedIds = getCompletedIdSet();
  const completedCount = cachedAchievements.filter((achievement) => completedIds.has(achievement.id)).length;
  const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  const progressBar = createProgressBar({
    value: completedCount,
    max: total || 1,
    labelId: 'achievements-progress-heading',
  });

  const wrapper = createElement('div');
  wrapper.appendChild(createElement('p', {
    text: `${completedCount}/${total} achievements completed (${percentage}%)`,
  }));
  wrapper.appendChild(progressBar);

  section.appendChild(createCard({
    id: 'achievements-progress',
    title: 'Progress',
    content: wrapper,
  }));
}

/**
 * Renders the filtered/sorted/grouped achievement list into the given
 * section, replacing any previous content.
 * @param {Element} section
 * @param {() => void} onToggle Passed down to every checkbox.
 */
function renderResults(section, onToggle) {
  clearChildren(section);

  const completedIds = getCompletedIdSet();
  const filtered = getFilteredAchievements();
  const sorted = sortAchievements(filtered, completedIds);

  if (sorted.length === 0) {
    section.appendChild(createCard({
      id: 'achievements-empty',
      title: 'No Achievements Found',
      content: 'Try adjusting your search or category filter.',
    }));
    return;
  }

  const groups = groupByCategory(sorted);
  const wrapper = createElement('div', { className: 'dashboard-grid' });

  groups.forEach((achievements, category) => {
    wrapper.appendChild(buildCategoryGroup(category, achievements, completedIds, onToggle));
  });

  section.appendChild(wrapper);
}

/**
 * Assembles the full Achievement Tracker UI (notice, summary, toolbar,
 * results) into the given root element.
 * @param {Element} root
 */
function buildAchievementsUI(root) {
  if (placeholderNotice) {
    root.appendChild(buildPlaceholderNotice(placeholderNotice));
  }

  const summarySection = createElement('div');
  const resultsSection = createElement('div');

  function rerender() {
    renderSummary(summarySection);
    renderResults(resultsSection, rerender);
  }

  const toolbar = buildToolbar(rerender);

  root.appendChild(summarySection);
  root.appendChild(toolbar);
  root.appendChild(resultsSection);

  rerender();
}

/**
 * Renders the full Achievement Tracker page into the given container.
 * The caller (app.js) is responsible for clearing the container and
 * building the shared page header before calling this. Data loading is
 * asynchronous: a loading message is shown immediately, replaced once
 * data/achievements.json resolves (or an error card, if it fails).
 * @param {Element|null} container
 */
export async function renderAchievements(container) {
  if (!container) return;

  const root = createElement('div', { attrs: { id: 'achievements-root' } });
  container.appendChild(root);
  root.appendChild(createElement('p', { text: 'Loading achievements…' }));

  let data;
  try {
    data = await loadAchievementsData();
  } catch (error) {
    clearChildren(root);
    root.appendChild(createCard({
      id: 'achievements-error',
      title: 'Unable to Load Achievements',
      content: 'There was a problem loading achievement data. Please try again later.',
    }));
    console.warn('[achievements] Failed to load data/achievements.json', error);
    return;
  }

  clearChildren(root);
  initializeState(data);
  buildAchievementsUI(root);
}
