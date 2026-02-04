const StudyGroup = require('../models/StudyGroup');
const User = require('../models/User');
const AppError = require('../utils/errors/AppError');
const { formatResponse, paginate } = require('../utils/helpers');
const { invalidateCache } = require('../middleware/cache');

const checkGroupAccess = async (groupId, userId, requireAdmin = false) => {
  const group = await StudyGroup.findById(groupId);
  if (!group) throw new AppError('Study group not found', 404);
  const member = group.members.find(m => m.userId.toString() === userId.toString());
  if (!member) {
    if (group.privacy === 'public') return { group, member: null, hasAccess: true };
    throw new AppError('Not authorized to access this group', 403);
  }
  if (requireAdmin && member.role !== 'admin') throw new AppError('Admin access required', 403);
  return { group, member, hasAccess: true };
};

const getGroups = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, privacy, search, sortBy = 'lastActivityAt', sortOrder = 'desc' } = req.query;
    const query = {};
    if (privacy) query.privacy = privacy;
    else query.privacy = { $in: ['public', 'invite-only'] };
    
    if (search) {
      try {
        query.$text = { $search: search };
      } catch (textIndexError) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
    }
    
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const [groups, total] = await Promise.all([
      StudyGroup.find(query)
        .populate('createdBy', 'username displayName avatarUrl')
        .populate('members.userId', 'username displayName avatarUrl')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean(),
      StudyGroup.countDocuments(query)
    ]);
    res.json(formatResponse('Study groups retrieved successfully', { groups }, paginate(total, page, limit)));
  } catch (error) {
    next(error);
  }
};

const createGroup = async (req, res, next) => {
  try {
    const { name, description, privacy = 'invite-only' } = req.body;
    const existing = await StudyGroup.findOne({ createdBy: req.user._id, name });
    if (existing) throw new AppError('You already have a group with this name', 409);
    const group = new StudyGroup({
      name,
      description,
      createdBy: req.user._id,
      members: [{ userId: req.user._id, role: 'admin' }],
      privacy
    });
    await group.save();
    await group.populate('createdBy', 'username displayName avatarUrl');
    await invalidateCache('study-groups:list:*');
    res.status(201).json(formatResponse('Study group created successfully', { group }));
  } catch (error) {
    next(error);
  }
};

const getGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { group } = await checkGroupAccess(groupId, req.user._id);
    await group.populate('createdBy', 'username displayName avatarUrl');
    await group.populate('members.userId', 'username displayName avatarUrl');
    await group.populate('challenges.participants.userId', 'username displayName avatarUrl');
    await group.populate('goals.participants.userId', 'username displayName avatarUrl');
    res.json(formatResponse('Study group retrieved successfully', { group }));
  } catch (error) {
    next(error);
  }
};

const updateGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { group } = await checkGroupAccess(groupId, req.user._id, true);
    Object.assign(group, req.body);
    await group.save();
    await invalidateCache(`study-group:${groupId}`);
    await invalidateCache('study-groups:list:*');
    res.json(formatResponse('Study group updated successfully', { group }));
  } catch (error) {
    next(error);
  }
};

const deleteGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { group } = await checkGroupAccess(groupId, req.user._id, true);
    await group.deleteOne();
    await invalidateCache(`study-group:${groupId}`);
    await invalidateCache('study-groups:list:*');
    await invalidateCache(`study-groups:user:${req.user._id}:membership`);
    res.json(formatResponse('Study group deleted successfully'));
  } catch (error) {
    next(error);
  }
};

const joinGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const group = await StudyGroup.findById(groupId);
    if (!group) throw new AppError('Study group not found', 404);
    if (group.privacy === 'private') throw new AppError('This group is private', 403);
    const existing = group.members.find(m => m.userId.toString() === req.user._id.toString());
    if (existing) throw new AppError('Already a member', 409);
    group.members.push({ userId: req.user._id, role: 'member' });
    group.lastActivityAt = new Date();
    await group.save();
    await invalidateCache(`study-group:${groupId}`);
    await invalidateCache('study-groups:list:*');
    await invalidateCache(`study-groups:user:${req.user._id}:membership`);
    res.json(formatResponse('Joined study group successfully', { membership: group.members[group.members.length - 1] }));
  } catch (error) {
    next(error);
  }
};

const leaveGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const group = await StudyGroup.findById(groupId);
    if (!group) throw new AppError('Study group not found', 404);
    const memberIndex = group.members.findIndex(m => m.userId.toString() === req.user._id.toString());
    if (memberIndex === -1) throw new AppError('Not a member', 404);
    const isAdmin = group.members[memberIndex].role === 'admin';
    const adminCount = group.members.filter(m => m.role === 'admin').length;
    if (isAdmin && adminCount === 1) throw new AppError('Cannot leave as last admin', 400);
    group.members.splice(memberIndex, 1);
    group.lastActivityAt = new Date();
    await group.save();
    await invalidateCache(`study-group:${groupId}`);
    await invalidateCache('study-groups:list:*');
    await invalidateCache(`study-groups:user:${req.user._id}:membership`);
    res.json(formatResponse('Left study group successfully'));
  } catch (error) {
    next(error);
  }
};

const removeMember = async (req, res, next) => {
  try {
    const { groupId, userId } = req.params;
    const { group } = await checkGroupAccess(groupId, req.user._id, true);
    if (userId === req.user._id.toString()) throw new AppError('Cannot remove yourself', 400);
    const memberIndex = group.members.findIndex(m => m.userId.toString() === userId);
    if (memberIndex === -1) throw new AppError('Member not found', 404);
    group.members.splice(memberIndex, 1);
    group.lastActivityAt = new Date();
    await group.save();
    await invalidateCache(`study-group:${groupId}`);
    await invalidateCache(`study-groups:user:${userId}:membership`);
    res.json(formatResponse('Member removed successfully'));
  } catch (error) {
    next(error);
  }
};

const createGoal = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { description, targetCount, deadline } = req.body;
    const { group } = await checkGroupAccess(groupId, req.user._id, true);
    group.goals.push({ description, targetCount, deadline });
    group.lastActivityAt = new Date();
    await group.save();
    await invalidateCache(`study-group:${groupId}`);
    res.status(201).json(formatResponse('Group goal created successfully', { goal: group.goals[group.goals.length - 1] }));
  } catch (error) {
    next(error);
  }
};

const joinGoal = async (req, res, next) => {
  try {
    const { groupId, goalId } = req.params;
    const { group } = await checkGroupAccess(groupId, req.user._id);
    const goal = group.goals.id(goalId);
    if (!goal) throw new AppError('Goal not found', 404);
    const existing = goal.participants.find(p => p.userId.toString() === req.user._id.toString());
    if (existing) throw new AppError('Already participating in this goal', 409);
    goal.participants.push({ userId: req.user._id });
    group.lastActivityAt = new Date();
    await group.save();
    await invalidateCache(`study-group:${groupId}`);
    res.json(formatResponse('Joined goal successfully', { goal }));
  } catch (error) {
    next(error);
  }
};

const updateGoalProgress = async (req, res, next) => {
  try {
    const { groupId, goalId } = req.params;
    const { progress } = req.body;
    const { group } = await checkGroupAccess(groupId, req.user._id);
    const goal = group.goals.id(goalId);
    if (!goal) throw new AppError('Goal not found', 404);
    const participant = goal.participants.find(p => p.userId.toString() === req.user._id.toString());
    if (!participant) throw new AppError('Not participating in this goal', 403);
    if (progress < 0 || progress > goal.targetCount) {
      throw new AppError(`Progress must be between 0 and ${goal.targetCount}`, 400);
    }
    participant.progress = progress;
    group.lastActivityAt = new Date();
    await group.save();
    await invalidateCache(`study-group:${groupId}`);
    res.json(formatResponse('Goal progress updated', { goal }));
  } catch (error) {
    next(error);
  }
};

const createChallenge = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { name, description, challengeType, target, startDate, endDate } = req.body;
    const { group } = await checkGroupAccess(groupId, req.user._id, true);
    group.challenges.push({ name, description, challengeType, target, startDate, endDate });
    group.lastActivityAt = new Date();
    await group.save();
    await invalidateCache(`study-group:${groupId}`);
    res.status(201).json(formatResponse('Group challenge created successfully', { challenge: group.challenges[group.challenges.length - 1] }));
  } catch (error) {
    next(error);
  }
};

const joinChallenge = async (req, res, next) => {
  try {
    const { groupId, challengeId } = req.params;
    const { group } = await checkGroupAccess(groupId, req.user._id);
    const challenge = group.challenges.id(challengeId);
    if (!challenge) throw new AppError('Challenge not found', 404);
    const existing = challenge.participants.find(p => p.userId.toString() === req.user._id.toString());
    if (existing) throw new AppError('Already participating', 409);
    challenge.participants.push({ userId: req.user._id });
    group.lastActivityAt = new Date();
    await group.save();
    await invalidateCache(`study-group:${groupId}`);
    res.json(formatResponse('Joined challenge successfully', { challenge }));
  } catch (error) {
    next(error);
  }
};

const updateChallengeProgress = async (req, res, next) => {
  try {
    const { groupId, challengeId } = req.params;
    const { progress } = req.body;
    const { group } = await checkGroupAccess(groupId, req.user._id);
    const challenge = group.challenges.id(challengeId);
    if (!challenge) throw new AppError('Challenge not found', 404);
    const participant = challenge.participants.find(p => p.userId.toString() === req.user._id.toString());
    if (!participant) throw new AppError('Not participating in challenge', 403);
    if (progress < 0 || progress > 100) {
      throw new AppError('Progress must be between 0 and 100', 400);
    }
    participant.progress = progress;
    group.lastActivityAt = new Date();
    await group.save();
    await invalidateCache(`study-group:${groupId}`);
    res.json(formatResponse('Challenge progress updated', { challenge }));
  } catch (error) {
    next(error);
  }
};

const getMyGroups = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const query = { 'members.userId': req.user._id };
    const [groups, total] = await Promise.all([
      StudyGroup.find(query)
        .populate('createdBy', 'username displayName avatarUrl')
        .populate('members.userId', 'username displayName avatarUrl')
        .sort({ lastActivityAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean(),
      StudyGroup.countDocuments(query)
    ]);
    res.json(formatResponse('Study groups retrieved successfully', { groups }, paginate(total, page, limit)));
  } catch (error) {
    next(error);
  }
};

const getGroupActivity = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { limit = 20 } = req.query;
    const { group } = await checkGroupAccess(groupId, req.user._id);
    const activities = [];
    
    group.goals.forEach(goal => {
      goal.participants.forEach(participant => {
        if (participant.progress > 0) {
          activities.push({
            type: 'goal_progress',
            userId: participant.userId,
            goalDescription: goal.description,
            progress: participant.progress,
            target: goal.targetCount,
            completed: participant.completed,
            timestamp: group.lastActivityAt
          });
        }
      });
    });
    
    group.challenges.forEach(challenge => {
      challenge.participants.forEach(participant => {
        if (participant.progress > 0) {
          activities.push({
            type: 'challenge_progress',
            userId: participant.userId,
            challengeName: challenge.name,
            progress: participant.progress,
            completed: participant.completed,
            timestamp: group.lastActivityAt
          });
        }
      });
    });
    
    activities.sort((a, b) => b.timestamp - a.timestamp);
    res.json(formatResponse('Group activity retrieved', { activities: activities.slice(0, limit), lastActivityAt: group.lastActivityAt }));
  } catch (error) {
    next(error);
  }
};

const getGroupStats = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { group } = await checkGroupAccess(groupId, req.user._id);
    const memberIds = group.members.map(m => m.userId);
    const users = await User.find({ _id: { $in: memberIds } });
    let totalProblemsSolved = 0;
    users.forEach(user => { totalProblemsSolved += user.stats.totalSolved; });
    
    const goalStats = group.goals.map(goal => ({
      description: goal.description,
      targetCount: goal.targetCount,
      participantCount: goal.participants.length,
      completedCount: goal.participants.filter(p => p.completed).length,
      status: goal.status
    }));
    
    const challengeStats = group.challenges.map(challenge => ({
      name: challenge.name,
      participantCount: challenge.participants.length,
      completedCount: challenge.participants.filter(p => p.completed).length,
      status: challenge.status
    }));
    
    const topPerformers = users.map(user => ({
      userId: user._id,
      username: user.username,
      problemsSolved: user.stats.totalSolved,
      streak: user.streak.current
    })).sort((a, b) => b.problemsSolved - a.problemsSolved).slice(0, 5);
    
    const stats = {
      memberCount: group.members.length,
      activeGoals: group.goals.filter(g => g.status === 'active').length,
      activeChallenges: group.challenges.filter(c => c.status === 'active').length,
      totalProblemsSolved,
      averageDailyActivity: Math.round(totalProblemsSolved / (group.members.length || 1)),
      goalStats,
      challengeStats,
      topPerformers
    };
    
    res.json(formatResponse('Group statistics retrieved', { stats }));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGroups,
  createGroup,
  getGroup,
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup,
  removeMember,
  createGoal,
  joinGoal,
  updateGoalProgress,
  createChallenge,
  joinChallenge,
  updateChallengeProgress,
  getMyGroups,
  getGroupActivity,
  getGroupStats
};