const mongoose = require('mongoose');
const { Schema } = mongoose;

const KnowledgeGraphSchema = new mongoose.Schema({
  // Ownership
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  
  // Graph Structure
  nodes: [{
    nodeId: { type: String, required: true },
    type: { 
      type: String, 
      required: true,
      enum: ['topic', 'subtopic', 'concept', 'question', 'skill', 'prerequisite']
    },
    
    // Topic/Concept Info
    label: { type: String, required: true },
    description: { type: String },
    hierarchyLevel: { type: Number, min: 0 }, // 0 = root
    
    // Topic-specific fields
    topicData: {
      category: { type: String }, // Data Structures, Algorithms, System Design
      parentTopic: { type: String },
      childTopics: [{ type: String }],
      prerequisiteTopics: [{ type: String }]
    },
    
    // Progress Visualization
    progress: {
      totalQuestions: { type: Number, default: 0 },
      solvedQuestions: { type: Number, default: 0 },
      completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
      confidenceScore: { type: Number, default: 0, min: 0, max: 1 },
      masteryLevel: { 
        type: String, 
        enum: ['novice', 'beginner', 'intermediate', 'advanced', 'master'],
        default: 'novice' 
      },
      lastPracticed: { type: Date }
    },
    
    // Question-specific fields (if type = 'question')
    questionData: {
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
      difficulty: { type: String },
      status: { type: String },
      timeSpent: { type: Number }
    },
    
    // Visualization Properties
    visualization: {
      position: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 }
      },
      size: { type: Number, default: 1 }, // node size based on importance
      color: { type: String }, // color based on progress/confidence
      isExpanded: { type: Boolean, default: false },
      isVisible: { type: Boolean, default: true }
    },
    
    // Customization
    customNotes: { type: String },
    isBookmarked: { type: Boolean, default: false },
    priority: { type: String, enum: ['high', 'medium', 'low'] }
  }],
  
  edges: [{
    edgeId: { type: String, required: true },
    sourceNodeId: { type: String, required: true },
    targetNodeId: { type: String, required: true },
    type: { 
      type: String, 
      required: true,
      enum: ['prerequisite', 'related', 'child-parent', 'similar', 'dependency']
    },
    strength: { type: Number, default: 1, min: 0, max: 1 }, // edge weight
    label: { type: String },
    
    // Learning Path info
    learningPathData: {
      isRequired: { type: Boolean, default: true },
      recommendedOrder: { type: Number },
      difficultyProgression: { type: String }
    }
  }],
  
  // Gap Analysis
  gapAnalysis: {
    identifiedGaps: [{
      nodeId: { type: String },
      gapType: { type: String, enum: ['prerequisite', 'weakness', 'missing'] },
      severity: { type: String, enum: ['high', 'medium', 'low'] },
      reason: { type: String },
      suggestedActions: [{ type: String }],
      detectedAt: { type: Date }
    }],
    lastAnalysisAt: { type: Date },
    analysisVersion: { type: String }
  },
  
  // Recommendations
  recommendations: [{
    nodeId: { type: String },
    recommendationType: { 
      type: String, 
      enum: ['focus', 'prerequisite', 'next-step', 'review', 'challenge']
    },
    priority: { type: String, enum: ['high', 'medium', 'low'] },
    reason: { type: String },
    confidence: { type: Number, min: 0, max: 1 },
    generatedAt: { type: Date },
    expiresAt: { type: Date }
  }],
  
  // AI-Powered Insights
  aiInsights: {
    learningPatterns: { type: mongoose.Schema.Types.Mixed },
    predictedWeaknesses: [{ type: String }],
    optimalPath: [{ type: String }], // optimal learning order
    similarityClusters: { type: mongoose.Schema.Types.Mixed }
  },
  
  // Community Comparison (opt-in)
  communityComparison: {
    isEnabled: { type: Boolean, default: false },
    peerAverageConfidence: { type: Number },
    peerRankPercentile: { type: Number },
    commonWeaknesses: [{ type: String }]
  },
  
  // Filter & View States
  filterState: {
    difficultyFilter: [{ type: String }],
    statusFilter: [{ type: String }],
    confidenceRange: { min: { type: Number }, max: { type: Number } },
    visibleNodeTypes: [{ type: String }]
  },
  
  // Metadata
  graphVersion: { type: String, default: '1.0.0' },
  lastVisualizedAt: { type: Date },
  
  // System
  isActive: { type: Boolean, default: true },
  lastUpdatedBy: { type: String, enum: ['user', 'ai', 'system'] },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  strict: true
});

// Indexes
KnowledgeGraphSchema.index({ userId: 1 }, { unique: true });
KnowledgeGraphSchema.index({ 'nodes.nodeId': 1 });
KnowledgeGraphSchema.index({ 'nodes.type': 1 });
KnowledgeGraphSchema.index({ 'nodes.progress.masteryLevel': 1 });
KnowledgeGraphSchema.index({ 'nodes.progress.confidenceScore': 1 });
KnowledgeGraphSchema.index({ 'gapAnalysis.identifiedGaps.severity': 1 });
KnowledgeGraphSchema.index({ 'recommendations.priority': 1, 'recommendations.generatedAt': -1 });
KnowledgeGraphSchema.index({ updatedAt: -1 });

// Static method to initialize knowledge graph for user
KnowledgeGraphSchema.statics.initializeForUser = async function(userId) {
  const defaultTopics = [
    // Data Structures
    {
      nodeId: 'data-structures',
      type: 'topic',
      label: 'Data Structures',
      description: 'Fundamental data structures for algorithm design',
      hierarchyLevel: 0,
      topicData: {
        category: 'Data Structures',
        childTopics: ['arrays', 'linked-lists', 'trees', 'graphs', 'hash-tables', 'stacks', 'queues', 'heaps']
      },
      progress: {
        totalQuestions: 0,
        solvedQuestions: 0,
        completionPercentage: 0,
        confidenceScore: 0,
        masteryLevel: 'novice'
      }
    },
    
    // Algorithms
    {
      nodeId: 'algorithms',
      type: 'topic',
      label: 'Algorithms',
      description: 'Fundamental algorithms and problem-solving patterns',
      hierarchyLevel: 0,
      topicData: {
        category: 'Algorithms',
        childTopics: ['sorting', 'searching', 'dynamic-programming', 'greedy', 'backtracking', 'divide-conquer']
      },
      progress: {
        totalQuestions: 0,
        solvedQuestions: 0,
        completionPercentage: 0,
        confidenceScore: 0,
        masteryLevel: 'novice'
      }
    },
    
    // Subtopic: Arrays
    {
      nodeId: 'arrays',
      type: 'subtopic',
      label: 'Arrays',
      description: 'One-dimensional arrays and their operations',
      hierarchyLevel: 1,
      topicData: {
        category: 'Data Structures',
        parentTopic: 'data-structures',
        childTopics: ['two-pointers', 'sliding-window', 'prefix-sum']
      },
      progress: {
        totalQuestions: 0,
        solvedQuestions: 0,
        completionPercentage: 0,
        confidenceScore: 0,
        masteryLevel: 'novice'
      }
    },
    
    // Concept: Two Pointers
    {
      nodeId: 'two-pointers',
      type: 'concept',
      label: 'Two Pointers',
      description: 'Using two pointers to traverse data structures',
      hierarchyLevel: 2,
      topicData: {
        category: 'Data Structures',
        parentTopic: 'arrays',
        prerequisiteTopics: ['arrays']
      },
      progress: {
        totalQuestions: 0,
        solvedQuestions: 0,
        completionPercentage: 0,
        confidenceScore: 0,
        masteryLevel: 'novice'
      }
    }
  ];
  
  const defaultEdges = [
    {
      edgeId: 'ds-arrays',
      sourceNodeId: 'data-structures',
      targetNodeId: 'arrays',
      type: 'child-parent',
      strength: 1.0,
      learningPathData: {
        isRequired: true,
        recommendedOrder: 1,
        difficultyProgression: 'easy'
      }
    },
    {
      edgeId: 'arrays-two-pointers',
      sourceNodeId: 'arrays',
      targetNodeId: 'two-pointers',
      type: 'child-parent',
      strength: 0.8,
      learningPathData: {
        isRequired: true,
        recommendedOrder: 2,
        difficultyProgression: 'easy'
      }
    },
    {
      edgeId: 'two-pointers-prereq',
      sourceNodeId: 'two-pointers',
      targetNodeId: 'arrays',
      type: 'prerequisite',
      strength: 0.9,
      learningPathData: {
        isRequired: true,
        recommendedOrder: 0
      }
    }
  ];
  
  const knowledgeGraph = new this({
    userId,
    nodes: defaultTopics,
    edges: defaultEdges,
    gapAnalysis: {
      identifiedGaps: [],
      lastAnalysisAt: new Date(),
      analysisVersion: '1.0.0'
    },
    recommendations: [],
    aiInsights: {
      learningPatterns: {},
      predictedWeaknesses: [],
      optimalPath: ['data-structures', 'arrays', 'two-pointers'],
      similarityClusters: {}
    },
    filterState: {
      difficultyFilter: [],
      statusFilter: [],
      confidenceRange: { min: 0, max: 1 },
      visibleNodeTypes: ['topic', 'subtopic', 'concept']
    }
  });
  
  return knowledgeGraph.save();
};

// Method to add node to graph
KnowledgeGraphSchema.methods.addNode = function(nodeData) {
  // Generate unique node ID if not provided
  if (!nodeData.nodeId) {
    nodeData.nodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Set default values
  const node = {
    nodeId: nodeData.nodeId,
    type: nodeData.type || 'topic',
    label: nodeData.label,
    description: nodeData.description || '',
    hierarchyLevel: nodeData.hierarchyLevel || 0,
    topicData: nodeData.topicData || {},
    progress: {
      totalQuestions: 0,
      solvedQuestions: 0,
      completionPercentage: 0,
      confidenceScore: 0,
      masteryLevel: 'novice',
      lastPracticed: null
    },
    questionData: nodeData.questionData || {},
    visualization: {
      position: nodeData.position || { x: 0, y: 0 },
      size: nodeData.size || 1,
      color: nodeData.color || '',
      isExpanded: nodeData.isExpanded || false,
      isVisible: nodeData.isVisible || true
    },
    customNotes: nodeData.customNotes || '',
    isBookmarked: nodeData.isBookmarked || false,
    priority: nodeData.priority || 'medium'
  };
  
  this.nodes.push(node);
  
  // If this is a child node, update parent's childTopics
  if (nodeData.topicData?.parentTopic) {
    const parentNode = this.nodes.find(n => n.nodeId === nodeData.topicData.parentTopic);
    if (parentNode) {
      if (!parentNode.topicData.childTopics) {
        parentNode.topicData.childTopics = [];
      }
      if (!parentNode.topicData.childTopics.includes(nodeData.nodeId)) {
        parentNode.topicData.childTopics.push(nodeData.nodeId);
      }
    }
  }
  
  return this.save();
};

// Method to add edge between nodes
KnowledgeGraphSchema.methods.addEdge = function(edgeData) {
  // Generate unique edge ID if not provided
  if (!edgeData.edgeId) {
    edgeData.edgeId = `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Verify both nodes exist
  const sourceNode = this.nodes.find(n => n.nodeId === edgeData.sourceNodeId);
  const targetNode = this.nodes.find(n => n.nodeId === edgeData.targetNodeId);
  
  if (!sourceNode || !targetNode) {
    throw new Error('Source or target node not found');
  }
  
  const edge = {
    edgeId: edgeData.edgeId,
    sourceNodeId: edgeData.sourceNodeId,
    targetNodeId: edgeData.targetNodeId,
    type: edgeData.type || 'related',
    strength: edgeData.strength || 0.5,
    label: edgeData.label || '',
    learningPathData: {
      isRequired: edgeData.isRequired !== undefined ? edgeData.isRequired : true,
      recommendedOrder: edgeData.recommendedOrder || 0,
      difficultyProgression: edgeData.difficultyProgression || ''
    }
  };
  
  this.edges.push(edge);
  
  // Update node relationships based on edge type
  if (edgeData.type === 'prerequisite') {
    // Add to source node's prerequisite topics
    if (!sourceNode.topicData.prerequisiteTopics) {
      sourceNode.topicData.prerequisiteTopics = [];
    }
    if (!sourceNode.topicData.prerequisiteTopics.includes(edgeData.targetNodeId)) {
      sourceNode.topicData.prerequisiteTopics.push(edgeData.targetNodeId);
    }
  }
  
  return this.save();
};

// Method to update node progress
KnowledgeGraphSchema.methods.updateNodeProgress = function(nodeId, progressData) {
  const node = this.nodes.find(n => n.nodeId === nodeId);
  
  if (!node) {
    throw new Error('Node not found');
  }
  
  // Update progress data
  if (progressData.totalQuestions !== undefined) {
    node.progress.totalQuestions = progressData.totalQuestions;
  }
  
  if (progressData.solvedQuestions !== undefined) {
    node.progress.solvedQuestions = progressData.solvedQuestions;
  }
  
  // Recalculate completion percentage
  if (node.progress.totalQuestions > 0) {
    node.progress.completionPercentage = Math.round(
      (node.progress.solvedQuestions / node.progress.totalQuestions) * 100
    );
  } else {
    node.progress.completionPercentage = 0;
  }
  
  if (progressData.confidenceScore !== undefined) {
    node.progress.confidenceScore = Math.max(0, Math.min(1, progressData.confidenceScore));
  }
  
  if (progressData.masteryLevel !== undefined) {
    node.progress.masteryLevel = progressData.masteryLevel;
  }
  
  if (progressData.lastPracticed !== undefined) {
    node.progress.lastPracticed = progressData.lastPracticed;
  }
  
  // Update visualization based on progress
  this.updateNodeVisualization(node);
  
  // Update lastUpdatedBy
  this.lastUpdatedBy = 'user';
  
  return this.save();
};

// Method to update node visualization
KnowledgeGraphSchema.methods.updateNodeVisualization = function(node) {
  // Update node size based on importance/completion
  const baseSize = 1;
  const completionBonus = node.progress.completionPercentage / 100;
  const confidenceBonus = node.progress.confidenceScore;
  
  node.visualization.size = baseSize + (completionBonus * 0.5) + (confidenceBonus * 0.3);
  
  // Update node color based on mastery level
  const colorMap = {
    novice: '#FF6B6B', // Red
    beginner: '#FFD166', // Yellow
    intermediate: '#06D6A0', // Green
    advanced: '#118AB2', // Blue
    master: '#073B4C' // Dark Blue
  };
  
  node.visualization.color = colorMap[node.progress.masteryLevel] || '#CCCCCC';
  
  return node;
};

// Method to add question to graph
KnowledgeGraphSchema.methods.addQuestionNode = async function(question, topicNodeIds = []) {
  const Question = mongoose.model('Question');
  const questionData = await Question.findById(question._id || question);
  
  if (!questionData) {
    throw new Error('Question not found');
  }
  
  // Create question node
  const questionNodeId = `question-${questionData._id}`;
  
  const questionNode = {
    nodeId: questionNodeId,
    type: 'question',
    label: questionData.title,
    description: `Problem from ${questionData.platform}`,
    hierarchyLevel: 3, // Questions are at level 3
    progress: {
      totalQuestions: 1,
      solvedQuestions: questionData.status === 'done' ? 1 : 0,
      completionPercentage: questionData.status === 'done' ? 100 : 0,
      confidenceScore: (questionData.confidenceScore || 1) / 5, // Convert 1-5 to 0-1
      masteryLevel: questionData.understandingLevel === 'mastered' ? 'master' : 
                   questionData.understandingLevel === 'understood' ? 'intermediate' : 'beginner',
      lastPracticed: questionData.solvedAt || questionData.updatedAt
    },
    questionData: {
      questionId: questionData._id,
      difficulty: questionData.difficulty,
      status: questionData.status,
      timeSpent: 0 // Would need to calculate from timers
    },
    visualization: {
      position: { x: 0, y: 0 },
      size: questionData.difficulty === 'hard' ? 1.2 : 
            questionData.difficulty === 'medium' ? 1.0 : 0.8,
      color: questionData.difficulty === 'hard' ? '#FF6B6B' :
             questionData.difficulty === 'medium' ? '#FFD166' : '#06D6A0',
      isExpanded: false,
      isVisible: true
    },
    customNotes: questionData.notes || '',
    isBookmarked: questionData.isPinned || false,
    priority: questionData.personalRating === 5 ? 'high' :
              questionData.personalRating >= 3 ? 'medium' : 'low'
  };
  
  // Add question node to graph
  this.nodes.push(questionNode);
  
  // Connect question to topic nodes
  for (const topicNodeId of topicNodeIds) {
    const topicNode = this.nodes.find(n => n.nodeId === topicNodeId);
    
    if (topicNode) {
      // Create edge from topic to question
      await this.addEdge({
        sourceNodeId: topicNodeId,
        targetNodeId: questionNodeId,
        type: 'child-parent',
        strength: 0.7,
        label: 'contains question'
      });
      
      // Update topic progress
      topicNode.progress.totalQuestions += 1;
      if (questionData.status === 'done') {
        topicNode.progress.solvedQuestions += 1;
      }
      
      // Update topic completion percentage
      if (topicNode.progress.totalQuestions > 0) {
        topicNode.progress.completionPercentage = Math.round(
          (topicNode.progress.solvedQuestions / topicNode.progress.totalQuestions) * 100
        );
      }
      
      // Update topic confidence (average of question confidences)
      const questionConfidence = (questionData.confidenceScore || 1) / 5;
      const totalConfidence = topicNode.progress.confidenceScore * (topicNode.progress.totalQuestions - 1);
      topicNode.progress.confidenceScore = (totalConfidence + questionConfidence) / topicNode.progress.totalQuestions;
      
      // Update topic mastery level based on completion and confidence
      this.updateTopicMasteryLevel(topicNode);
    }
  }
  
  // Update lastUpdatedBy
  this.lastUpdatedBy = 'system';
  
  return this.save();
};

// Method to update topic mastery level
KnowledgeGraphSchema.methods.updateTopicMasteryLevel = function(topicNode) {
  const { completionPercentage, confidenceScore } = topicNode.progress;
  
  if (completionPercentage >= 80 && confidenceScore >= 0.8) {
    topicNode.progress.masteryLevel = 'master';
  } else if (completionPercentage >= 60 && confidenceScore >= 0.6) {
    topicNode.progress.masteryLevel = 'advanced';
  } else if (completionPercentage >= 40 && confidenceScore >= 0.4) {
    topicNode.progress.masteryLevel = 'intermediate';
  } else if (completionPercentage >= 20 && confidenceScore >= 0.2) {
    topicNode.progress.masteryLevel = 'beginner';
  } else {
    topicNode.progress.masteryLevel = 'novice';
  }
  
  return topicNode;
};

// Method to run gap analysis
KnowledgeGraphSchema.methods.runGapAnalysis = function() {
  const gaps = [];
  const now = new Date();
  
  // Analyze each topic node
  this.nodes.forEach(node => {
    if (node.type === 'topic' || node.type === 'subtopic' || node.type === 'concept') {
      // Check for weak areas (low confidence or completion)
      if (node.progress.confidenceScore < 0.3 || node.progress.completionPercentage < 30) {
        gaps.push({
          nodeId: node.nodeId,
          gapType: 'weakness',
          severity: node.progress.confidenceScore < 0.2 ? 'high' : 'medium',
          reason: `Low confidence (${Math.round(node.progress.confidenceScore * 100)}%) or completion (${node.progress.completionPercentage}%)`,
          suggestedActions: [
            `Review basic concepts of ${node.label}`,
            `Practice more ${node.label} problems`,
            `Watch tutorial videos on ${node.label}`
          ],
          detectedAt: now
        });
      }
      
      // Check for missing prerequisites
      if (node.topicData.prerequisiteTopics) {
        node.topicData.prerequisiteTopics.forEach(prereqId => {
          const prereqNode = this.nodes.find(n => n.nodeId === prereqId);
          
          if (prereqNode && 
              (prereqNode.progress.confidenceScore < 0.5 || 
               prereqNode.progress.completionPercentage < 50)) {
            gaps.push({
              nodeId: node.nodeId,
              gapType: 'prerequisite',
              severity: 'high',
              reason: `Missing prerequisite: ${prereqNode.label} (confidence: ${Math.round(prereqNode.progress.confidenceScore * 100)}%)`,
              suggestedActions: [
                `Complete prerequisite topic: ${prereqNode.label}`,
                `Review ${prereqNode.label} before attempting ${node.label}`,
                `Focus on ${prereqNode.label} fundamentals first`
              ],
              detectedAt: now
            });
          }
        });
      }
    }
  });
  
  // Update gap analysis
  this.gapAnalysis.identifiedGaps = gaps;
  this.gapAnalysis.lastAnalysisAt = now;
  this.gapAnalysis.analysisVersion = (parseFloat(this.gapAnalysis.analysisVersion || '1.0.0') + 0.1).toFixed(1);
  
  // Generate recommendations based on gaps
  this.generateRecommendations();
  
  return this.save();
};

// Method to generate recommendations
KnowledgeGraphSchema.methods.generateRecommendations = function() {
  const recommendations = [];
  const now = new Date();
  
  // Sort gaps by severity
  const sortedGaps = [...this.gapAnalysis.identifiedGaps].sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });
  
  // Create recommendations from top gaps
  sortedGaps.slice(0, 5).forEach(gap => {
    const node = this.nodes.find(n => n.nodeId === gap.nodeId);
    
    if (node) {
      recommendations.push({
        nodeId: gap.nodeId,
        recommendationType: gap.gapType === 'prerequisite' ? 'prerequisite' : 'focus',
        priority: gap.severity,
        reason: gap.reason,
        confidence: 0.8,
        generatedAt: now,
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });
    }
  });
  
  // Add next-step recommendations for completed topics
  const completedTopics = this.nodes.filter(node => 
    (node.type === 'topic' || node.type === 'subtopic' || node.type === 'concept') &&
    node.progress.completionPercentage >= 70 &&
    node.progress.confidenceScore >= 0.7
  );
  
  completedTopics.forEach(topic => {
    // Find child topics that need work
    if (topic.topicData.childTopics) {
      topic.topicData.childTopics.forEach(childId => {
        const childNode = this.nodes.find(n => n.nodeId === childId);
        
        if (childNode && 
            childNode.progress.completionPercentage < 50 && 
            !recommendations.some(r => r.nodeId === childId)) {
          
          recommendations.push({
            nodeId: childId,
            recommendationType: 'next-step',
            priority: 'medium',
            reason: `Ready to advance to ${childNode.label} after completing ${topic.label}`,
            confidence: 0.7,
            generatedAt: now,
            expiresAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) // 14 days
          });
        }
      });
    }
  });
  
  this.recommendations = recommendations;
  return recommendations;
};

// Method to get graph data for visualization
KnowledgeGraphSchema.methods.getVisualizationData = function() {
  const nodes = this.nodes.map(node => ({
    id: node.nodeId,
    type: node.type,
    label: node.label,
    description: node.description,
    hierarchyLevel: node.hierarchyLevel,
    progress: node.progress,
    questionData: node.questionData,
    visualization: node.visualization,
    customNotes: node.customNotes,
    isBookmarked: node.isBookmarked,
    priority: node.priority,
    topicData: node.topicData
  }));
  
  const edges = this.edges.map(edge => ({
    id: edge.edgeId,
    source: edge.sourceNodeId,
    target: edge.targetNodeId,
    type: edge.type,
    strength: edge.strength,
    label: edge.label,
    learningPathData: edge.learningPathData
  }));
  
  return {
    nodes,
    edges,
    gapAnalysis: this.gapAnalysis,
    recommendations: this.recommendations,
    filterState: this.filterState,
    graphVersion: this.graphVersion,
    lastVisualizedAt: this.lastVisualizedAt || new Date()
  };
};

// Method to get learning path
KnowledgeGraphSchema.methods.getLearningPath = function(startNodeId = null) {
  // Simple learning path algorithm - prioritize by prerequisites and progress
  
  const learningNodes = this.nodes.filter(node => 
    node.type === 'topic' || node.type === 'subtopic' || node.type === 'concept'
  );
  
  // Sort nodes by hierarchy level (fundamentals first)
  const sortedNodes = [...learningNodes].sort((a, b) => {
    // First by hierarchy level (lower = more fundamental)
    if (a.hierarchyLevel !== b.hierarchyLevel) {
      return a.hierarchyLevel - b.hierarchyLevel;
    }
    
    // Then by progress (less complete first)
    if (a.progress.completionPercentage !== b.progress.completionPercentage) {
      return a.progress.completionPercentage - b.progress.completionPercentage;
    }
    
    // Then by confidence (lower confidence first)
    return a.progress.confidenceScore - b.progress.confidenceScore;
  });
  
  // If start node is specified, filter to nodes that are reachable from it
  let pathNodes = sortedNodes;
  if (startNodeId) {
    const startNode = this.nodes.find(n => n.nodeId === startNodeId);
    if (startNode) {
      // Get all child/descendant nodes
      const descendantIds = new Set();
      const collectDescendants = (nodeId) => {
        const node = this.nodes.find(n => n.nodeId === nodeId);
        if (node && node.topicData.childTopics) {
          node.topicData.childTopics.forEach(childId => {
            descendantIds.add(childId);
            collectDescendants(childId);
          });
        }
      };
      
      collectDescendants(startNodeId);
      pathNodes = sortedNodes.filter(node => 
        node.nodeId === startNodeId || descendantIds.has(node.nodeId)
      );
    }
  }
  
  return pathNodes.map(node => ({
    nodeId: node.nodeId,
    label: node.label,
    type: node.type,
    progress: node.progress,
    prerequisites: node.topicData.prerequisiteTopics || [],
    estimatedTime: estimateLearningTime(node)
  }));
};

// Helper function to estimate learning time
function estimateLearningTime(node) {
  const baseTimePerQuestion = 30; // minutes
  const questionsToComplete = Math.max(5, node.progress.totalQuestions - node.progress.solvedQuestions);
  
  // Adjust based on difficulty level (inferred from hierarchy)
  const difficultyMultiplier = node.hierarchyLevel < 2 ? 0.8 : 
                               node.hierarchyLevel < 4 ? 1.0 : 1.5;
  
  // Adjust based on current confidence
  const confidenceMultiplier = 1.0 - (node.progress.confidenceScore * 0.5);
  
  const estimatedMinutes = baseTimePerQuestion * questionsToComplete * difficultyMultiplier * confidenceMultiplier;
  
  return {
    minutes: Math.round(estimatedMinutes),
    hours: Math.round(estimatedMinutes / 60 * 10) / 10,
    days: Math.round((estimatedMinutes / 60 / 2) * 10) / 10 // Assuming 2 hours per day
  };
}

// Method to export knowledge graph
KnowledgeGraphSchema.methods.exportGraph = function(format = 'json') {
  const data = this.getVisualizationData();
  
  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  } else if (format === 'csv') {
    // Export nodes as CSV
    let csv = 'Node ID,Label,Type,Completion %,Confidence,Mastery Level,Total Questions,Solved Questions\n';
    
    this.nodes.forEach(node => {
      csv += `${node.nodeId},${node.label},${node.type},${node.progress.completionPercentage},${Math.round(node.progress.confidenceScore * 100)}%,${node.progress.masteryLevel},${node.progress.totalQuestions},${node.progress.solvedQuestions}\n`;
    });
    
    return csv;
  }
  
  return data;
};

const KnowledgeGraph = mongoose.model('KnowledgeGraph', KnowledgeGraphSchema);

module.exports = KnowledgeGraph;