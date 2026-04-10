const mongoose = require('mongoose');
const config = require('../src/config');
const Question = require('../src/models/Question');
const metadataExtractor = require('../src/services/metadataExtractor.service');

async function fixAllMetadata() {
    await mongoose.connect(config.database.uri);
    const questions = await Question.find({
        $or: [
            { className: { $ne: 'Solution' } },
            { className: null }
        ]
    });
    let updated = 0;
    for (const q of questions) {
        // Prefer Python starter code
        const pythonCode = q.starterCode?.get('Python3') || q.starterCode?.get('Python');
        if (!pythonCode) continue;
        const meta = metadataExtractor.extractMetadata('python', pythonCode);
        if (meta && meta.className === 'Solution' && meta.methodName) {
            q.methodName = meta.methodName;
            q.className = meta.className;
            q.paramTypes = meta.paramTypes;
            q.returnType = meta.returnType;
            q.isInteractive = meta.isInteractive;
            await q.save();
            updated++;
            console.log(`Fixed ${q._id}: ${q.title} -> className=${q.className}, methodName=${q.methodName}`);
        }
    }
    console.log(`Fixed ${updated} questions.`);
    process.exit(0);
}

fixAllMetadata().catch(console.error);