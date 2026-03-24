const CodeExecutionProviderFactory = require('./codeExecution/provider.factory');

let provider = null;

const getProvider = () => {
  if (!provider) provider = CodeExecutionProviderFactory.createProvider();
  return provider;
};

const executeCode = async ({ language, code, stdin }) => {
  return getProvider().execute({ language, code, stdin });
};

const executeBatch = async ({ language, code, testCases }) => {
  return getProvider().executeBatch({ language, code, testCases });
};

module.exports = { executeCode, executeBatch };