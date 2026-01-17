const validator = require('validator');
const constants = require('../config/constants');

class ValidationUtils {
  static isEmail(email) {
    return validator.isEmail(email);
  }

  static isURL(url, options = {}) {
    return validator.isURL(url, {
      require_protocol: true,
      require_valid_protocol: true,
      ...options
    });
  }

  static isObjectId(id) {
    return constants.PATTERNS.OBJECT_ID.test(id);
  }

  static isDate(date) {
    return validator.isISO8601(date);
  }

  static isNumber(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
  }

  static isInteger(value) {
    return Number.isInteger(Number(value));
  }

  static isBoolean(value) {
    return typeof value === 'boolean' || 
           value === 'true' || value === 'false' ||
           value === 0 || value === 1;
  }

  static isString(value) {
    return typeof value === 'string';
  }

  static isArray(value) {
    return Array.isArray(value);
  }

  static isObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  static isEmpty(value) {
    if (value === null || value === undefined) return true;
    
    if (typeof value === 'string') {
      return validator.isEmpty(value, { ignore_whitespace: true });
    }
    
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    
    if (typeof value === 'object') {
      return Object.keys(value).length === 0;
    }
    
    return false;
  }

  static isNotEmpty(value) {
    return !this.isEmpty(value);
  }

  static isLength(value, options) {
    if (!value || typeof value !== 'string') return false;
    
    const { min = 0, max = undefined } = options || {};
    
    if (min && value.length < min) return false;
    if (max && value.length > max) return false;
    
    return true;
  }

  static isIn(value, allowedValues) {
    if (!Array.isArray(allowedValues)) return false;
    return allowedValues.includes(value);
  }

  static isAlpha(value, locale = 'en-US') {
    if (!value || typeof value !== 'string') return false;
    return validator.isAlpha(value, locale);
  }

  static isAlphanumeric(value, locale = 'en-US') {
    if (!value || typeof value !== 'string') return false;
    return validator.isAlphanumeric(value, locale);
  }

  static isNumeric(value) {
    return validator.isNumeric(String(value));
  }

  static isDecimal(value, options = {}) {
    return validator.isDecimal(String(value), options);
  }

  static isJSON(value) {
    if (typeof value === 'object') return true;
    
    if (typeof value !== 'string') return false;
    
    try {
      JSON.parse(value);
      return true;
    } catch (error) {
      return false;
    }
  }

  static isUUID(value, version = 'all') {
    return validator.isUUID(value, version);
  }

  static isIP(value, version = 'any') {
    return validator.isIP(value, version);
  }

  static isPort(value) {
    return validator.isPort(String(value));
  }

  static isMACAddress(value) {
    return validator.isMACAddress(value);
  }

  static isMongoId(value) {
    return validator.isMongoId(value);
  }

  static isJWT(value) {
    return validator.isJWT(value);
  }

  static isCreditCard(value) {
    return validator.isCreditCard(value);
  }

  static isIBAN(value) {
    return validator.isIBAN(value);
  }

  static isBIC(value) {
    return validator.isBIC(value);
  }

  static isTaxID(value, locale = 'en-US') {
    return validator.isTaxID(value, locale);
  }

  static isPassportNumber(value, countryCode = 'US') {
    return validator.isPassportNumber(value, countryCode);
  }

  static isPostalCode(value, locale = 'any') {
    return validator.isPostalCode(value, locale);
  }

  static isCurrency(value, options = {}) {
    return validator.isCurrency(value, options);
  }

  static isBase64(value) {
    return validator.isBase64(value);
  }

  static isDataURI(value) {
    return validator.isDataURI(value);
  }

  static isMimeType(value) {
    return validator.isMimeType(value);
  }

  static isHSL(value) {
    return validator.isHSL(value);
  }

  static isHexColor(value) {
    return validator.isHexColor(value);
  }

  static isRgbColor(value) {
    return validator.isRgbColor(value);
  }

  static isHslColor(value) {
    return validator.isHslColor(value);
  }

  static isMultibyte(value) {
    return validator.isMultibyte(value);
  }

  static isSemVer(value) {
    return validator.isSemVer(value);
  }

  static isSurrogatePair(value) {
    return validator.isSurrogatePair(value);
  }

  static validateSchema(data, schema) {
    const errors = {};
    
    for (const field in schema) {
      const rules = schema[field];
      const value = data[field];
      
      if (rules.required && this.isEmpty(value)) {
        errors[field] = `${field} is required`;
        continue;
      }
      
      if (!rules.required && this.isEmpty(value)) {
        continue;
      }
      
      if (rules.type && !this.validateType(value, rules.type)) {
        errors[field] = `${field} must be a ${rules.type}`;
      }
      
      if (rules.min !== undefined && this.isNumber(value) && value < rules.min) {
        errors[field] = `${field} must be at least ${rules.min}`;
      }
      
      if (rules.max !== undefined && this.isNumber(value) && value > rules.max) {
        errors[field] = `${field} must be at most ${rules.max}`;
      }
      
      if (rules.minLength && this.isString(value) && value.length < rules.minLength) {
        errors[field] = `${field} must be at least ${rules.minLength} characters`;
      }
      
      if (rules.maxLength && this.isString(value) && value.length > rules.maxLength) {
        errors[field] = `${field} must be at most ${rules.maxLength} characters`;
      }
      
      if (rules.pattern && this.isString(value) && !rules.pattern.test(value)) {
        errors[field] = `${field} format is invalid`;
      }
      
      if (rules.enum && !rules.enum.includes(value)) {
        errors[field] = `${field} must be one of: ${rules.enum.join(', ')}`;
      }
      
      if (rules.custom && !rules.custom(value, data)) {
        errors[field] = rules.message || `${field} is invalid`;
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors: errors
    };
  }

  static validateType(value, type) {
    switch (type) {
      case 'string': return this.isString(value);
      case 'number': return this.isNumber(value);
      case 'integer': return this.isInteger(value);
      case 'boolean': return this.isBoolean(value);
      case 'array': return this.isArray(value);
      case 'object': return this.isObject(value);
      case 'date': return this.isDate(value);
      case 'email': return this.isEmail(value);
      case 'url': return this.isURL(value);
      case 'objectId': return this.isObjectId(value);
      default: return true;
    }
  }

  static sanitizeInput(input) {
    if (typeof input === 'string') {
      return validator.trim(validator.escape(input));
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    if (this.isObject(input)) {
      const sanitized = {};
      
      for (const key in input) {
        if (Object.prototype.hasOwnProperty.call(input, key)) {
          sanitized[key] = this.sanitizeInput(input[key]);
        }
      }
      
      return sanitized;
    }
    
    return input;
  }

  static normalizeEmail(email, options = {}) {
    if (!this.isEmail(email)) return email;
    
    return validator.normalizeEmail(email, {
      gmail_remove_dots: false,
      gmail_remove_subaddress: false,
      outlookdotcom_remove_subaddress: false,
      yahoo_remove_subaddress: false,
      icloud_remove_subaddress: false,
      ...options
    });
  }

  static escapeHtml(input) {
    if (!input || typeof input !== 'string') return input;
    
    return validator.escape(input);
  }

  static unescapeHtml(input) {
    if (!input || typeof input !== 'string') return input;
    
    return validator.unescape(input);
  }

  static stripLow(input, keep_new_lines = false) {
    if (!input || typeof input !== 'string') return input;
    
    return validator.stripLow(input, keep_new_lines);
  }

  static blacklist(input, chars) {
    if (!input || typeof input !== 'string') return input;
    
    return validator.blacklist(input, chars);
  }

  static whitelist(input, chars) {
    if (!input || typeof input !== 'string') return input;
    
    return validator.whitelist(input, chars);
  }

  static ltrim(input, chars = '\\s') {
    if (!input || typeof input !== 'string') return input;
    
    return validator.ltrim(input, chars);
  }

  static rtrim(input, chars = '\\s') {
    if (!input || typeof input !== 'string') return input;
    
    return validator.rtrim(input, chars);
  }

  static toDate(input) {
    if (!input) return null;
    
    if (input instanceof Date) return input;
    
    if (this.isNumber(input)) {
      return new Date(input);
    }
    
    if (this.isString(input) && this.isDate(input)) {
      return new Date(input);
    }
    
    return null;
  }

  static toInt(input, radix = 10) {
    return validator.toInt(input, radix);
  }

  static toFloat(input) {
    return validator.toFloat(input);
  }

  static toBoolean(input, strict = false) {
    if (typeof input === 'boolean') return input;
    
    if (strict) {
      return input === true || input === 'true' || input === 1;
    }
    
    return !!input;
  }

  static equals(input, comparison) {
    return validator.equals(input, comparison);
  }

  static contains(input, seed) {
    return validator.contains(input, seed);
  }

  static matches(input, pattern, modifiers = '') {
    return validator.matches(input, pattern, modifiers);
  }
}

module.exports = ValidationUtils;