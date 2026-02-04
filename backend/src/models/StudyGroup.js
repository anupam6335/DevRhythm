const mongoose = require('mongoose');

const StudyGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  goals: [{
    description: String,
    targetCount: {
      type: Number,
      min: 1
    },
    currentCount: {
      type: Number,
      default: 0,
      min: 0
    },
    deadline: Date,
    status: {
      type: String,
      enum: ['active', 'completed', 'failed'],
      default: 'active'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    participants: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      progress: {
        type: Number,
        default: 0,
        min: 0
      },
      completed: {
        type: Boolean,
        default: false
      },
      completedAt: Date
    }]
  }],
  challenges: [{
    name: String,
    description: String,
    challengeType: {
      type: String,
      enum: ['sprint', 'marathon', 'difficulty-focused', 'pattern-focused']
    },
    target: {
      type: Number,
      min: 1
    },
    startDate: Date,
    endDate: Date,
    participants: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      completed: {
        type: Boolean,
        default: false
      },
      completedAt: Date
    }],
    status: {
      type: String,
      enum: ['upcoming', 'active', 'completed'],
      default: 'upcoming'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  privacy: {
    type: String,
    enum: ['public', 'private', 'invite-only'],
    default: 'invite-only'
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

StudyGroupSchema.index({ createdBy: 1 });
StudyGroupSchema.index({ 'members.userId': 1 });
StudyGroupSchema.index({ privacy: 1 });
StudyGroupSchema.index({ lastActivityAt: -1 });
StudyGroupSchema.index({ createdAt: -1 });
StudyGroupSchema.index({ createdBy: 1, name: 1 }, { unique: true });

StudyGroupSchema.index({ name: 1, description: 1 });

StudyGroupSchema.pre('save', function(next) {
  const now = new Date();
  
  this.challenges.forEach(challenge => {
    challenge.participants.forEach(participant => {
      if (participant.progress >= 100 && !participant.completed) {
        participant.completed = true;
        participant.completedAt = now;
      }
    });
    
    const completedParticipants = challenge.participants.filter(p => p.completed).length;
    const totalParticipants = challenge.participants.length;
    
    if (challenge.status === 'active' && completedParticipants > 0 && 
        completedParticipants === totalParticipants) {
      challenge.status = 'completed';
    }
  });
  
  this.goals.forEach(goal => {
    goal.participants.forEach(participant => {
      if (participant.progress >= goal.targetCount && !participant.completed) {
        participant.completed = true;
        participant.completedAt = now;
      }
    });
    
    const completedCount = goal.participants.reduce((sum, p) => sum + (p.completed ? 1 : 0), 0);
    if (goal.status === 'active' && completedCount >= goal.targetCount) {
      goal.status = 'completed';
    } else if (goal.status === 'active' && goal.deadline && goal.deadline < now) {
      goal.status = 'failed';
    }
  });
  
  next();
});

StudyGroupSchema.statics.createTextIndex = async function() {
  try {
    const indexExists = await this.collection.indexExists('name_text_description_text');
    if (!indexExists) {
      await this.collection.createIndex({ name: 'text', description: 'text' });
      console.log('Text index created for StudyGroup');
    }
  } catch (error) {
    console.warn('Could not create text index for StudyGroup:', error.message);
  }
};

module.exports = mongoose.model('StudyGroup', StudyGroupSchema);