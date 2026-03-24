const CodeExecutionProviderFactory = require('./codeExecution/provider.factory');

let provider = null;

const getProvider = () => {
  if (!provider) {
    provider = CodeExecutionProviderFactory.createProvider();
  }
  return provider;
};

const executeCode = async ({ language, code, stdin }) => {
  const execProvider = getProvider();
  return execProvider.execute({ language, code, stdin });
};

module.exports = { executeCode };