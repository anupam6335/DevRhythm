const mongoose = require('mongoose');
const config = require('../src/config');
const Question = require('../src/models/Question');
const metadataExtractor = require('../src/services/metadataExtractor.service');

async function debug() {
    await mongoose.connect(config.database.uri);
    const q = await Question.findById('69ca51c7353ce156b89697ad');
    if (!q) {
        console.log('Question not found');
        process.exit(1);
    }
    const pythonCode = q.starterCode?.get('Python3') || q.starterCode?.get('Python');
    console.log('=== Starter Code ===');
    console.log(pythonCode);
    console.log('\n=== Extracted Metadata ===');
    const meta = metadataExtractor.extractMetadata('python', pythonCode);
    console.log(JSON.stringify(meta, null, 2));
    process.exit(0);
}

debug().catch(console.error);