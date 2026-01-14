const crypto = require('crypto');
const validator = require('validator');
const config = require('../config/environment');
const constants = require('../config/constants');

class StringUtils {
  constructor() {
    this.slugSeparator = '-';
    this.truncateEllipsis = '...';
  }

  generateRandomString(length = 32, charset = 'alphanumeric') {
    const charsets = {
      numeric: '0123456789',
      alphabetic: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
      alphanumeric: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
      hex: '0123456789abcdef',
      base64: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
      urlSafe: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_'
    };

    const characters = charsets[charset] || charsets.alphanumeric;
    let result = '';
    
    const randomBytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      result += characters[randomBytes[i] % characters.length];
    }
    
    return result;
  }

  generateHash(data, algorithm = 'sha256', encoding = 'hex') {
    if (typeof data !== 'string') {
      data = JSON.stringify(data);
    }
    
    return crypto
      .createHash(algorithm)
      .update(data)
      .digest(encoding);
  }

  generateUUID(version = 'v4') {
    if (version === 'v4') {
      return crypto.randomUUID();
    }
    
    return crypto.randomBytes(16).toString('hex');
  }

  slugify(text, separator = this.slugSeparator) {
    if (!text) return '';
    
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, separator)
      .replace(new RegExp(`^${separator}+|${separator}+$`, 'g'), '');
  }

  truncate(text, maxLength, ellipsis = this.truncateEllipsis) {
    if (!text || text.length <= maxLength) {
      return text;
    }
    
    if (maxLength <= ellipsis.length) {
      return ellipsis.substring(0, maxLength);
    }
    
    return text.substring(0, maxLength - ellipsis.length) + ellipsis;
  }

  truncateWords(text, maxWords, ellipsis = this.truncateEllipsis) {
    if (!text) return '';
    
    const words = text.split(/\s+/);
    
    if (words.length <= maxWords) {
      return text;
    }
    
    return words.slice(0, maxWords).join(' ') + ellipsis;
  }

  capitalize(text) {
    if (!text) return '';
    
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  capitalizeWords(text) {
    if (!text) return '';
    
    return text
      .split(/\s+/)
      .map(word => this.capitalize(word))
      .join(' ');
  }

  camelCase(text) {
    if (!text) return '';
    
    return text
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
      .replace(/^[A-Z]/, chr => chr.toLowerCase());
  }

  pascalCase(text) {
    if (!text) return '';
    
    const camel = this.camelCase(text);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
  }

  snakeCase(text) {
    if (!text) return '';
    
    return text
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .toLowerCase()
      .replace(/^_+|_+$/g, '');
  }

  kebabCase(text) {
    if (!text) return '';
    
    return text
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .toLowerCase()
      .replace(/^-+|-+$/g, '');
  }

  stripHTML(text) {
    if (!text) return '';
    
    return text.replace(/<[^>]*>/g, '');
  }

  escapeHTML(text) {
    if (!text) return '';
    
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '`': '&#96;'
    };
    
    return text.replace(/[&<>"'`]/g, char => escapeMap[char]);
  }

  unescapeHTML(text) {
    if (!text) return '';
    
    const unescapeMap = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&#96;': '`'
    };
    
    return text.replace(/&(amp|lt|gt|quot|#39|#96);/g, entity => unescapeMap[entity]);
  }

  stripTags(text, allowedTags = []) {
    if (!text) return '';
    
    if (allowedTags.length === 0) {
      return this.stripHTML(text);
    }
    
    const tagPattern = new RegExp(
      `<(?!\\/?(${allowedTags.join('|')})\\b)[^>]*>`,
      'gi'
    );
    
    return text.replace(tagPattern, '');
  }

  normalizeWhitespace(text) {
    if (!text) return '';
    
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\t/g, '    ')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  countWords(text) {
    if (!text) return 0;
    
    return text
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0)
      .length;
  }

  countCharacters(text, includeSpaces = true) {
    if (!text) return 0;
    
    if (includeSpaces) {
      return text.length;
    }
    
    return text.replace(/\s+/g, '').length;
  }

  isValidEmail(email) {
    return validator.isEmail(email);
  }

  isValidURL(url, options = {}) {
    const defaultOptions = {
      require_protocol: true,
      require_valid_protocol: true,
      protocols: ['http', 'https'],
      require_host: true,
      require_port: false
    };
    
    return validator.isURL(url, { ...defaultOptions, ...options });
  }

  isValidPhone(phone, locale = 'any') {
    return validator.isMobilePhone(phone, locale, { strictMode: false });
  }

  isValidCreditCard(cardNumber) {
    return validator.isCreditCard(cardNumber);
  }

  isValidUUID(uuid, version = 'all') {
    return validator.isUUID(uuid, version);
  }

  isValidJSON(json) {
    try {
      JSON.parse(json);
      return true;
    } catch (error) {
      return false;
    }
  }

  isNumeric(text) {
    return validator.isNumeric(text, { no_symbols: true });
  }

  isAlpha(text, locale = 'en-US') {
    return validator.isAlpha(text, locale);
  }

  isAlphanumeric(text, locale = 'en-US') {
    return validator.isAlphanumeric(text, locale);
  }

  isBase64(text) {
    return validator.isBase64(text);
  }

  isHexadecimal(text) {
    return validator.isHexadecimal(text);
  }

  isMongoId(text) {
    return validator.isMongoId(text);
  }

  isStrongPassword(password, options = {}) {
    const defaultOptions = {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
      returnScore: false
    };
    
    return validator.isStrongPassword(password, { ...defaultOptions, ...options });
  }

  maskEmail(email, visibleChars = 3) {
    if (!this.isValidEmail(email)) {
      return email;
    }
    
    const [localPart, domain] = email.split('@');
    const maskedLocal = this.maskString(localPart, visibleChars);
    
    return `${maskedLocal}@${domain}`;
  }

  maskPhone(phone, visibleChars = 4) {
    const digits = phone.replace(/\D/g, '');
    return this.maskString(digits, visibleChars, 'phone');
  }

  maskString(text, visibleChars = 3, type = 'default') {
    if (!text || text.length <= visibleChars * 2) {
      return text;
    }
    
    const firstVisible = text.substring(0, visibleChars);
    const lastVisible = text.substring(text.length - visibleChars);
    const maskedLength = text.length - (visibleChars * 2);
    
    let maskChar = '*';
    if (type === 'phone') {
      maskChar = '•';
    } else if (type === 'creditCard') {
      maskChar = 'X';
    }
    
    const masked = maskChar.repeat(maskedLength);
    
    return firstVisible + masked + lastVisible;
  }

  generatePassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    return this.generateRandomString(length, charset);
  }

  generateApiKey(prefix = 'dr_') {
    const key = this.generateRandomString(32, 'urlSafe');
    return prefix + key;
  }

  generateShortCode(length = 8) {
    return this.generateRandomString(length, 'alphanumeric').toUpperCase();
  }

  generateVerificationCode(length = 6) {
    return this.generateRandomString(length, 'numeric');
  }

  normalizeString(text) {
    if (!text) return '';
    
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  similarity(text1, text2) {
    if (!text1 || !text2) return 0;
    
    const str1 = this.normalizeString(text1);
    const str2 = this.normalizeString(text2);
    
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    const longerLength = longer.length;
    if (longerLength === 0) return 1.0;
    
    return (longerLength - this.editDistance(longer, shorter)) / parseFloat(longerLength);
  }

  editDistance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
    
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) {
        costs[s2.length] = lastValue;
      }
    }
    return costs[s2.length];
  }

  containsAny(text, keywords) {
    if (!text || !keywords || !Array.isArray(keywords)) {
      return false;
    }
    
    const normalizedText = this.normalizeString(text);
    
    return keywords.some(keyword => {
      const normalizedKeyword = this.normalizeString(keyword);
      return normalizedText.includes(normalizedKeyword);
    });
  }

  containsAll(text, keywords) {
    if (!text || !keywords || !Array.isArray(keywords)) {
      return false;
    }
    
    const normalizedText = this.normalizeString(text);
    
    return keywords.every(keyword => {
      const normalizedKeyword = this.normalizeString(keyword);
      return normalizedText.includes(normalizedKeyword);
    });
  }

  extractEmails(text) {
    if (!text) return [];
    
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    return text.match(emailRegex) || [];
  }

  extractURLs(text) {
    if (!text) return [];
    
    const urlRegex = /https?:\/\/[^\s]+/g;
    return text.match(urlRegex) || [];
  }

  extractHashtags(text) {
    if (!text) return [];
    
    const hashtagRegex = /#(\w+)/g;
    const matches = text.match(hashtagRegex) || [];
    return matches.map(tag => tag.substring(1));
  }

  extractMentions(text) {
    if (!text) return [];
    
    const mentionRegex = /@(\w+)/g;
    const matches = text.match(mentionRegex) || [];
    return matches.map(mention => mention.substring(1));
  }

  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  formatNumber(number, decimals = 0) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(number);
  }

  formatCurrency(amount, currency = 'USD', locale = 'en-US') {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  formatPercentage(number, decimals = 1) {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(number / 100);
  }

  pluralize(count, singular, plural = null) {
    if (count === 1) {
      return `${count} ${singular}`;
    }
    
    if (plural) {
      return `${count} ${plural}`;
    }
    
    return `${count} ${singular}s`;
  }

  ordinalSuffix(number) {
    const j = number % 10;
    const k = number % 100;
    
    if (j === 1 && k !== 11) {
      return `${number}st`;
    }
    
    if (j === 2 && k !== 12) {
      return `${number}nd`;
    }
    
    if (j === 3 && k !== 13) {
      return `${number}rd`;
    }
    
    return `${number}th`;
  }
}

const stringUtils = new StringUtils();
module.exports = stringUtils;