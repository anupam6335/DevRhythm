const Question = require('../../models/Question');
const PythonExtractor = require('./metadataExtractor/pythonExtractor');
const JavaExtractor = require('./metadataExtractor/javaExtractor');
const CppExtractor = require('./metadataExtractor/cppExtractor');
const JavascriptExtractor = require('./metadataExtractor/javascriptExtractor');

// Map of language names to extractor instances
const extractors = {
  python: new PythonExtractor(),
  java: new JavaExtractor(),
  cpp: new CppExtractor(),
  javascript: new JavascriptExtractor(),
};

/**
 * MetadataService - Retrieves or extracts execution metadata for a given problem and language.
 * Stores extracted metadata back into the Question document for future reuse.
 */
class MetadataService {
  /**
   * Get execution metadata for a question and language.
   * First checks the database cache; if not present, extracts from starter code and stores.
   * @param {string} questionId - MongoDB ObjectId of the question.
   * @param {string} language - One of 'python', 'java', 'cpp', 'javascript'.
   * @returns {Promise<Object>} Metadata object (shape defined in extractors).
   * @throws {Error} If language is unsupported or extraction fails.
   */
  async getExecutionMetadata(questionId, language) {
    if (!extractors[language]) {
      throw new Error(`Unsupported language for metadata extraction: ${language}`);
    }

    const question = await Question.findById(questionId).lean();
    if (!question) throw new Error(`Question not found: ${questionId}`);

    // Normalize language key for lookup (handle LeetCode's "Python3", "C++", etc.)
    const langMap = {
      python: ['python', 'python3'],
      cpp: ['cpp', 'c++'],
      java: ['java'],
      javascript: ['javascript', 'js'],
    };
    const possibleKeys = langMap[language] || [language];

    // Helper to get starter code from either Map or plain object
    const getStarterCode = (starterCode, langKey) => {
      if (!starterCode) return null;
      if (starterCode instanceof Map) return starterCode.get(langKey);
      if (typeof starterCode === 'object') return starterCode[langKey];
      return null;
    };

    let starterCode = null;
    for (const key of possibleKeys) {
      starterCode = getStarterCode(question.starterCode, key);
      if (starterCode) break;
    }

    if (!starterCode || typeof starterCode !== 'string' || starterCode.trim() === '') {
      throw new Error(`Starter code missing for language ${language} in question ${questionId}`);
    }

    // Check cache
    const metadataMap = question.executionMetadata || {};
    let metadata = metadataMap[language];
    if (metadata) return metadata;

    // Extract
    try {
      metadata = extractors[language].extract(starterCode);
    } catch (extractError) {
      throw new Error(`Failed to extract metadata for ${language}: ${extractError.message}`);
    }

    // Store back (asynchronous)
    this._storeMetadata(questionId, language, metadata).catch(err => {
      console.error(`Failed to store metadata for question ${questionId}, language ${language}:`, err);
    });

    return metadata;
  }

  /**
   * Store extracted metadata in the database.
   * @param {string} questionId - MongoDB ObjectId.
   * @param {string} language - Language key.
   * @param {Object} metadata - Extracted metadata.
   * @returns {Promise<void>}
   */
  async _storeMetadata(questionId, language, metadata) {
    await Question.updateOne(
      { _id: questionId },
      { $set: { [`executionMetadata.${language}`]: metadata } }
    );
  }

  /**
   * Pre‑extract metadata for all supported languages of a question.
   * Useful for background jobs after question creation/update.
   * @param {string} questionId - MongoDB ObjectId.
   * @returns {Promise<Object>} Map of language -> metadata.
   */
  async preExtractAll(questionId) {
    const question = await Question.findById(questionId).lean();
    if (!question) {
      throw new Error(`Question not found: ${questionId}`);
    }
    const starterCodeMap = question.starterCode || {};
    const results = {};

    for (const [lang, extractor] of Object.entries(extractors)) {
      const starterCode = starterCodeMap[lang];
      if (starterCode && typeof starterCode === 'string' && starterCode.trim() !== '') {
        try {
          const metadata = extractor.extract(starterCode);
          results[lang] = metadata;
          await this._storeMetadata(questionId, lang, metadata);
        } catch (err) {
          console.error(`Pre‑extraction failed for ${lang} on question ${questionId}:`, err);
          // Continue with other languages
        }
      }
    }
    return results;
  }
}

module.exports = new MetadataService();