const mongoose = require('mongoose');

const RevisionScheduleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  },
  schedule: {
    type: [Date],
    required: true,
  },
  completedRevisions: [{
    date: Date,
    completedAt: Date,
    status: {
      type: String,
      enum: ['completed', 'skipped'],
    },
  }],
  currentRevisionIndex: {
    type: Number,
    default: 0,
    min: 0,
    max: 4,
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'overdue'],
    default: 'active',
  },
  overdueCount: {
    type: Number,
    default: 0,
  },
  baseDate: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
});

RevisionScheduleSchema.index({ userId: 1, status: 1 });
RevisionScheduleSchema.index({ userId: 1, schedule: 1 });
RevisionScheduleSchema.index({ userId: 1, questionId: 1 }, { unique: true });
RevisionScheduleSchema.index({ schedule: 1, status: 1 });
RevisionScheduleSchema.index({ userId: 1, currentRevisionIndex: 1 });
RevisionScheduleSchema.index({ schedule: 1, userId: 1, status: 1 });
RevisionScheduleSchema.index({
  createdAt: 1,
}, {
  expireAfterSeconds: 2592000,
  partialFilterExpression: { status: 'completed' },
});

module.exports = mongoose.model('RevisionSchedule', RevisionScheduleSchema);