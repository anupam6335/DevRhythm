/**
 * Apply sorting to a Mongoose query based on request query params.
 * 
 * @param {import('mongoose').Query} query - The Mongoose query object.
 * @param {Object} reqQuery - The request query object (req.query).
 * @param {Object} defaultSort - Default sort object (e.g., { createdAt: -1 }).
 * @param {Object} fieldMap - Optional mapping of frontend sortBy to actual DB fields.
 * @returns {import('mongoose').Query} The query with sorting applied.
 */
const applySorting = (query, reqQuery, defaultSort = { createdAt: -1 }, fieldMap = {}) => {
  const { sortBy, sortOrder = 'desc' } = reqQuery;

  // Determine sort field
  let sortField = sortBy;
  if (sortField && fieldMap[sortField]) {
    sortField = fieldMap[sortField];
  }

  // Build sort object
  const sort = sortField
    ? { [sortField]: sortOrder === 'asc' ? 1 : -1 }
    : defaultSort;

  return query.sort(sort);
};

module.exports = { applySorting };