const mongoose = require('mongoose');
const StudyGroup = require('../src/models/StudyGroup');

const createIndexes = async () => {
  try {
    const config = require('../src/config');
    
    await mongoose.connect(config.database.uri, {
      maxPoolSize: config.database.maxPoolSize,
      minPoolSize: config.database.minPoolSize,
      serverSelectionTimeoutMS: config.database.connectionTimeoutMs
    });
    
    console.log('Connected to MongoDB');
    
    await StudyGroup.createTextIndex();
    
    console.log('Text index created for StudyGroup');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating indexes:', error);
    process.exit(1);
  }
};

createIndexes();