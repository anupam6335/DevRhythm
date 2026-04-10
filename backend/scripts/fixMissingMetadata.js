/* const mongoose = require('mongoose');
const config = require('../src/config');
const Question = require('../src/models/Question');
const metadataExtractor = require('../src/services/metadataExtractor.service');

async function fixAllMetadata() {
    await mongoose.connect(config.database.uri);
    const questions = await Question.find({
        $or: [
            { methodName: { $in: [null, '__init__'] } },
            { isInteractive: true }
        ]
    });
    let updated = 0;
    for (const q of questions) {
        let changed = false;
        // Prefer Python starter code
        const pythonCode = q.starterCode?.get('Python3') || q.starterCode?.get('Python');
        if (pythonCode) {
            const meta = metadataExtractor.extractMetadata('python', pythonCode);
            if (meta && meta.methodName && meta.methodName !== '__init__') {
                q.methodName = meta.methodName;
                q.className = meta.className;
                q.paramTypes = meta.paramTypes;
                q.returnType = meta.returnType;
                q.isInteractive = meta.isInteractive;
                changed = true;
            }
        }
        if (changed) {
            await q.save();
            updated++;
            console.log(`Updated ${q._id}: ${q.title} -> method=${q.methodName}, interactive=${q.isInteractive}`);
        }
    }
    console.log(`Fixed ${updated} questions.`);
    process.exit(0);
}

fixAllMetadata().catch(console.error); */

const mongoose = require('mongoose');
const config = require('../src/config');
const Question = require('../src/models/Question');

async function fix() {
    await mongoose.connect(config.database.uri);
    const q = await Question.findById('69ca5b4aaeae7cedc0b48cf8');
    if (!q) {
        console.error('Question not found');
        process.exit(1);
    }
    // Force correct metadata for this problem
    q.methodName = 'copyRandomList';
    q.className = 'Solution';
    q.paramTypes = ['Optional[Node]'];   // The parameter type
    q.returnType = 'Optional[Node]';     // The return type
    q.isInteractive = false;
    await q.save();
    console.log('Metadata updated successfully');
    process.exit(0);
}
fix().catch(console.error);