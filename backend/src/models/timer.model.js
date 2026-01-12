const mongoose = require('mongoose');
const { Schema } = mongoose;

const TimerSchema = new mongoose.Schema({
  // Ownership & Context
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true, index: true },
  dayId: { type: mongoose.Schema.Types.ObjectId, ref: 'Day', index: true },
  
  // Timer State
  status: { 
    type: String, 
    enum: ['running', 'paused', 'stopped', 'completed'],
    default: 'stopped',
    index: true 
  },
  
  // Current Session
  currentSession: {
    startTime: { type: Date },
    pausedAt: { type: Date },
    totalPausedTime: { type: Number, default: 0 }, // milliseconds
    lastResumeTime: { type: Date }
  },
  
  // Timing Statistics
  totalElapsedTime: { type: Number, default: 0 }, // milliseconds
  bestTime: { type: Number }, // milliseconds (lowest)
  worstTime: { type: Number }, // milliseconds (highest)
  averageTime: { type: Number }, // milliseconds
  
  // Attempt Tracking
  attemptCount: { type: Number, default: 0 },
  currentAttempt: { type: Number, default: 1 },
  
  // Segment Timing (Pomodoro style)
  segments: [{
    segmentType: { 
      type: String, 
      enum: ['thinking', 'coding', 'debugging', 'break', 'review'] 
    },
    startTime: { type: Date },
    endTime: { type: Date },
    duration: { type: Number }, // milliseconds
    notes: { type: String }
  }],
  
  // Distraction Tracking
  distractions: [{
    reason: { type: String },
    startTime: { type: Date },
    endTime: { type: Date },
    duration: { type: Number }
  }],
  
  // Time Limits & Warnings
  optimalTimeTarget: { type: Number }, // milliseconds per difficulty
  timeLimit: { type: Number }, // milliseconds
  warningTriggered: { type: Boolean, default: false },
  
  // Completion Data
  completedAt: { type: Date },
  completionStatus: { 
    type: String, 
    enum: ['within-limit', 'exceeded-limit', 'abandoned'] 
  },
  
  // Device/Client Info
  clientId: { type: String }, // for multi-tab sync
  deviceInfo: { type: String },
  
  // Persistence & Recovery
  lastSavedAt: { type: Date },
  recoveryToken: { type: String },
  
  // System
  isActive: { type: Boolean, default: true },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  strict: true
});

// Indexes
TimerSchema.index({ userId: 1, questionId: 1, status: 1 });
TimerSchema.index({ userId: 1, status: 1 });
TimerSchema.index({ questionId: 1, status: 1 });
TimerSchema.index({ userId: 1, completedAt: -1 });
TimerSchema.index({ userId: 1, dayId: 1, status: 1 });
TimerSchema.index({ 'currentSession.startTime': 1 });

// Method to start timer
TimerSchema.methods.startTimer = function(clientId = null) {
  const now = new Date();
  
  this.status = 'running';
  this.currentSession = {
    startTime: now,
    lastResumeTime: now,
    totalPausedTime: 0,
    pausedAt: null
  };
  
  if (clientId) {
    this.clientId = clientId;
  }
  
  // Start a new segment
  this.segments.push({
    segmentType: 'thinking',
    startTime: now,
    notes: 'Started solving problem'
  });
  
  return this.save();
};

// Method to pause timer
TimerSchema.methods.pauseTimer = function(reason = 'manual') {
  if (this.status !== 'running') {
    throw new Error('Timer is not running');
  }
  
  const now = new Date();
  
  // End current segment
  if (this.segments.length > 0) {
    const lastSegment = this.segments[this.segments.length - 1];
    if (!lastSegment.endTime) {
      lastSegment.endTime = now;
      lastSegment.duration = now - lastSegment.startTime;
    }
  }
  
  this.status = 'paused';
  this.currentSession.pausedAt = now;
  
  // Record distraction if pause is not intentional review
  if (reason !== 'review') {
    this.distractions.push({
      reason: reason,
      startTime: now
    });
  }
  
  return this.save();
};

// Method to resume timer
TimerSchema.methods.resumeTimer = function() {
  if (this.status !== 'paused') {
    throw new Error('Timer is not paused');
  }
  
  const now = new Date();
  
  // Calculate paused time
  if (this.currentSession.pausedAt) {
    const pausedDuration = now - this.currentSession.pausedAt;
    this.currentSession.totalPausedTime += pausedDuration;
    this.currentSession.pausedAt = null;
  }
  
  // Close any open distraction
  if (this.distractions.length > 0) {
    const lastDistraction = this.distractions[this.distractions.length - 1];
    if (!lastDistraction.endTime) {
      lastDistraction.endTime = now;
      lastDistraction.duration = now - lastDistraction.startTime;
    }
  }
  
  this.status = 'running';
  this.currentSession.lastResumeTime = now;
  
  // Start new segment
  this.segments.push({
    segmentType: 'coding',
    startTime: now,
    notes: 'Resumed solving'
  });
  
  return this.save();
};

// Method to stop timer
TimerSchema.methods.stopTimer = function(completionStatus = 'abandoned') {
  const now = new Date();
  
  // Calculate total elapsed time
  if (this.currentSession.startTime) {
    const totalSessionTime = now - this.currentSession.startTime;
    const effectiveTime = totalSessionTime - this.currentSession.totalPausedTime;
    
    this.totalElapsedTime += effectiveTime;
    
    // Update best/worst times
    if (!this.bestTime || effectiveTime < this.bestTime) {
      this.bestTime = effectiveTime;
    }
    if (!this.worstTime || effectiveTime > this.worstTime) {
      this.worstTime = effectiveTime;
    }
    
    // Update average time
    this.averageTime = (this.totalElapsedTime / this.attemptCount) || effectiveTime;
  }
  
  // End current segment
  if (this.segments.length > 0) {
    const lastSegment = this.segments[this.segments.length - 1];
    if (!lastSegment.endTime) {
      lastSegment.endTime = now;
      lastSegment.duration = now - lastSegment.startTime;
    }
  }
  
  // End any open distractions
  this.distractions.forEach(distraction => {
    if (!distraction.endTime) {
      distraction.endTime = now;
      distraction.duration = now - distraction.startTime;
    }
  });
  
  this.status = 'stopped';
  this.completedAt = now;
  this.completionStatus = completionStatus;
  this.attemptCount += 1;
  
  // Reset current session
  this.currentSession = {
    startTime: null,
    pausedAt: null,
    totalPausedTime: 0,
    lastResumeTime: null
  };
  
  return this.save();
};

// Method to get current elapsed time
TimerSchema.methods.getCurrentElapsedTime = function() {
  if (this.status !== 'running') {
    return this.totalElapsedTime;
  }
  
  const now = new Date();
  const sessionStart = this.currentSession.startTime;
  
  if (!sessionStart) {
    return this.totalElapsedTime;
  }
  
  const sessionTime = now - sessionStart;
  const effectiveTime = sessionTime - this.currentSession.totalPausedTime;
  
  return this.totalElapsedTime + effectiveTime;
};

// Method to get timer status
TimerSchema.methods.getStatus = function() {
  const elapsedTime = this.getCurrentElapsedTime();
  const timeInSeconds = Math.floor(elapsedTime / 1000);
  
  return {
    status: this.status,
    elapsedTime: timeInSeconds,
    currentAttempt: this.currentAttempt,
    segments: this.segments.length,
    distractions: this.distractions.length,
    isActive: this.isActive
  };
};

const Timer = mongoose.model('Timer', TimerSchema);

module.exports = Timer;