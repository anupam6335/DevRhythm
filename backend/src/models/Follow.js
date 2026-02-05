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

FollowSchema.index({ followerId: 1, followedId: 1 }, { unique: true });
FollowSchema.index({ followedId: 1, createdAt: -1 });
FollowSchema.index({ followerId: 1, createdAt: -1 });
FollowSchema.index({ followedId: 1, isActive: 1 });
FollowSchema.index({ followerId: 1, isActive: 1 });

module.exports = mongoose.model("Follow", FollowSchema);