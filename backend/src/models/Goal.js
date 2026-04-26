const mongoose = require("mongoose");

const GoalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    goalType: {
      type: String,
      enum: ["daily", "weekly", "planned"],
      required: true,
    },
    targetCount: {
      type: Number,
      required: true,
      min: 1,
    },
    completedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "completed", "failed"],
      default: "active",
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    achievedAt: Date,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    targetQuestions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
    completedQuestions: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
        platformQuestionId: { type: String, trim: true }, // NEW
        completedAt: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

GoalSchema.index({ userId: 1, goalType: 1, startDate: -1 });
GoalSchema.index({ userId: 1, status: 1, endDate: 1 });
GoalSchema.index({ userId: 1, endDate: -1 });
GoalSchema.index({ userId: 1, completionPercentage: -1 });
GoalSchema.index({ userId: 1, goalType: 1, status: 1 });
GoalSchema.index({ userId: 1, targetQuestions: 1 });
GoalSchema.index({ userId: 1, goalType: "planned", status: 1, startDate: 1, endDate: 1 });

GoalSchema.pre("save", function (next) {
  this.updatedAt = Date.now();

  if (this.goalType === "planned") {
    this.targetCount = this.targetQuestions.length;
    this.completedCount = this.completedQuestions.length;
  }

  this.completionPercentage = Math.min(
    100,
    Math.round((this.completedCount / this.targetCount) * 100)
  );

  if (this.completedCount >= this.targetCount && this.status !== "completed") {
    this.status = "completed";
    this.achievedAt = new Date();
  } else if (
    this.completedCount < this.targetCount &&
    new Date() > this.endDate &&
    this.status === "active"
  ) {
    this.status = "failed";
  }
  next();
});

module.exports = mongoose.model("Goal", GoalSchema);