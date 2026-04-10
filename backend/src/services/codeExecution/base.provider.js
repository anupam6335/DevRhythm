/**
 * Abstract base class for code execution providers.
 */
class BaseCodeExecutionProvider {
  async execute({ language, code, stdin }) {
    throw new Error('Not implemented');
  }
}

module.exports = BaseCodeExecutionProvider;