const axios = require('axios');
const jwt = require('jsonwebtoken');
const config = require('./src/config');

const token = jwt.sign({ userId: '123456789012345678901234' }, config.jwt.secret);

axios.post('http://localhost:5000/api/v1/code/execute', {
  language: 'python',
  code: 'return input.strip()',
  stdin: 'hello',
  questionId: '69c0edfba6c6e04f9fc28434',
}, {
  headers: { Authorization: `Bearer ${token}` }
})
.then(res => console.log('Response:', res.data))
.catch(err => console.error('Error:', err.response?.data || err.message));