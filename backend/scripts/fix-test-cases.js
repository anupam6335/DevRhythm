const mongoose = require('mongoose');
const Question = require('../src/models/Question'); // adjust path

const run = async () => {
  await mongoose.connect('mongodb://localhost:27017/devrhythm');
  const correctTestCases = [
    { stdin: "2 3 6 7\n7", expected: "[[2,2,3],[7]]" },
    { stdin: "2 3 5\n8", expected: "[[2,2,2,2],[2,3,3],[3,5]]" },
    { stdin: "2\n1", expected: "[]" }
  ];
  const updated = await Question.findByIdAndUpdate(
    "69ba8432f89703ea338d11d3",
    { testCases: correctTestCases },
    { new: true }
  );
  console.log("Updated question:", updated.title);
  process.exit(0);
};

run().catch(console.error);