/**
 * Graph Registry Service
 * 
 * Provides a central registry for all dashboard graphs.
 * Each graph is defined by an id, title, and dataFetcher function.
 * New graphs can be registered without modifying existing code.
 */

const GoalSnapshotService = require('./goalSnapshot.service');

// Registry storage
const graphRegistry = new Map();

/**
 * Register a new graph provider
 * @param {string} id - Unique graph identifier (e.g., 'goal', 'pattern_mastery')
 * @param {Object} provider - Graph definition
 * @param {string} provider.title - Human readable title
 * @param {Function} provider.dataFetcher - Async function (userId, timeZone, options) => { labels, datasets, metadata }
 * @param {Object} provider.defaultOptions - Default options for dataFetcher
 */
const registerGraph = (id, provider) => {
  if (graphRegistry.has(id)) {
    console.warn(`Graph with id '${id}' already registered. Overwriting.`);
  }
  graphRegistry.set(id, provider);
};

/**
 * Get data for a specific graph
 * @param {string} id - Graph identifier
 * @param {string} userId - User ID
 * @param {string} timeZone - IANA timezone
 * @param {Object} options - Graph-specific options (merged with defaultOptions)
 * @returns {Promise<Object>} - Graph data { labels, datasets, metadata }
 */
const getGraphData = async (id, userId, timeZone, options = {}) => {
  const provider = graphRegistry.get(id);
  if (!provider) {
    throw new Error(`Graph '${id}' not found in registry`);
  }
  const mergedOptions = { ...provider.defaultOptions, ...options };
  return provider.dataFetcher(userId, timeZone, mergedOptions);
};

/**
 * Get all registered graph ids with their titles
 * @returns {Array<{id: string, title: string}>}
 */
const listGraphs = () => {
  return Array.from(graphRegistry.entries()).map(([id, provider]) => ({
    id,
    title: provider.title
  }));
};

// ========== Built-in Graph Providers ==========

// Goal Graph (last 6 months)
registerGraph('goal', {
  title: 'Goal Progress',
  defaultOptions: { months: 6, includeComparison: true },
  dataFetcher: async (userId, timeZone, { months = 6, includeComparison = true }) => {
    try {
      const chartData = await GoalSnapshotService.getChartData(userId, 'monthly', {
        months,
        includeComparison,
        timeZone
      });
      return {
        labels: chartData.labels,
        datasets: [
          { label: 'Goals Completed', data: chartData.user.goalsCompleted },
          { label: 'Goal Related Solved', data: chartData.user.questionsSolvedGoalRelated }
        ],
        metadata: {
          comparisonAvg: chartData.comparison?.avgGoalsCompleted || null
        }
      };
    } catch (error) {
      console.error('Error fetching goal graph data:', error);
      return { labels: [], datasets: [], metadata: { error: error.message } };
    }
  }
});

// Future graphs can be added by calling registerGraph() with new providers:
//
// registerGraph('pattern_mastery', {
//   title: 'Pattern Mastery Trend',
//   defaultOptions: { limit: 5, metric: 'confidence', months: 6 },
//   dataFetcher: async (userId, timeZone, { limit, metric, months }) => { ... }
// });
//
// registerGraph('revision_trend', {
//   title: 'Revision Completion Trend',
//   defaultOptions: { months: 6 },
//   dataFetcher: async (userId, timeZone, { months }) => { ... }
// });
//
// registerGraph('difficulty_breakdown', {
//   title: 'Problems Solved by Difficulty',
//   defaultOptions: { months: 6 },
//   dataFetcher: async (userId, timeZone, { months }) => { ... }
// });

module.exports = {
  registerGraph,
  getGraphData,
  listGraphs
};