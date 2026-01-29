const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.replace(/[<>'"&]/g, '');
};

const truncate = (str, length) => {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
};

const generateRandomString = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const slugify = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

module.exports = {
  sanitizeInput,
  truncate,
  generateRandomString,
  slugify,
  capitalize
};