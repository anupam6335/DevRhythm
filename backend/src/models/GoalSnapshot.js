const mongoose = require('mongoose');

/**
 * GoalSnapshot Schema
 *
 * Stores pre‑aggregated goal statistics for a specific user and time period,
 * as well as global averages (userId = null).
 *
 * Each document represents either:
 * - A monthly snapshot (month = 1‑12, periodType = 'monthly')
 * - A yearly snapshot (month = 0, periodType = 'yearly')
 *
 * Snapshots are updated by a cron job once per day/month and serve as the
 * single source of truth for goal charts, eliminating expensive real‑time
 * aggregations.
 */
const GoalSnapshotSchema = new mongoose.Schema(
  {
    // User identifier; null for global averages
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },

    // Type of aggregation period
    periodType: {
      type: String,
      enum: ['monthly', 'yearly'],
      required: true,
    },

    // ISO year (e.g., 2025)
    year: {
      type: Number,
      required: true,
      min: 2000,
      max: 2100,
    },

    // Month number (1‑12) for monthly snapshots; 0 for yearly snapshots
    month: {
      type: Number,
      required: true,
      validate: {
        validator: function (v) {
          if (this.periodType === 'monthly') return v >= 1 && v <= 12;
          if (this.periodType === 'yearly') return v === 0;
          return false;
        },
        message: 'Invalid month for the given periodType',
      },
    },

    // --- User‑specific aggregated metrics ---
    goalsCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },
    goalsNotCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },
    questionsSolvedForGoals: {
      type: Number,
      default: 0,
      min: 0,
    },

    // --- Global average metrics (only when userId = null) ---
    // Average goals completed across all public users
    avgGoalsCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Number of users that contributed to the average (helpful for trust/weight)
    contributingUsersCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Timestamp when this snapshot was last calculated
    calculatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Unique composite index: per user, period type, year, month.
// For global snapshots, userId = null.
GoalSnapshotSchema.index(
  { userId: 1, periodType: 1, year: 1, month: 1 },
  { unique: true }
);

// Index for fetching user's recent snapshots (last 12 months)
GoalSnapshotSchema.index({ userId: 1, periodType: 1, year: -1, month: -1 });

// Index for global snapshot retrieval by period
GoalSnapshotSchema.index({ userId: 1, periodType: 1, year: 1, month: 1 });

// TTL index to automatically remove very old snapshots (optional, keep 3 years)
GoalSnapshotSchema.index(
  { calculatedAt: 1 },
  { expireAfterSeconds: 3 * 365 * 24 * 60 * 60, partialFilterExpression: { userId: { $ne: null } } }
);

module.exports = mongoose.model('GoalSnapshot', GoalSnapshotSchema);