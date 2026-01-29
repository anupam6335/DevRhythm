const response = require('./response');
const pagination = require('./pagination');
const date = require('./date');
const string = require('./string');

module.exports = {
  ...response,
  ...pagination,
  ...date,
  ...string
};