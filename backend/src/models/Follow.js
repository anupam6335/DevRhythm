const mongoose = require('mongoose');

const FollowSchema = new mongoose.Schema(
  {
    followerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    followedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      enum: ["follow", "unfollow"],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// ========== EXISTING INDEXES (preserved) ==========
FollowSchema.index({ followerId: 1, followedId: 1 }, { unique: true });
FollowSchema.index({ followedId: 1, createdAt: -1 });
FollowSchema.index({ followerId: 1, createdAt: -1 });
FollowSchema.index({ followedId: 1, isActive: 1 });
FollowSchema.index({ followerId: 1, isActive: 1 });

// ========== NEW PERFORMANCE INDEXES ==========
// For fetching current user's following list (used in mutual friends computation)
FollowSchema.index({ followerId: 1, isActive: 1 });

// For fetching current user's followers list (used in mutual friends computation)
FollowSchema.index({ followedId: 1, isActive: 1 });

// For mutual friends intersection: find users followed by target user that are also followed by current user
// This index supports queries that filter by both followerId and followedId
FollowSchema.index({ followerId: 1, followedId: 1, isActive: 1 });

module.exports = mongoose.model("Follow", FollowSchema);