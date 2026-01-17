class StringUtils {
  static capitalize(str) {
    if (!str || typeof str !== 'string') return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  static capitalizeWords(str) {
    if (!str || typeof str !== 'string') return str;
    return str.split(' ').map(word => this.capitalize(word)).join(' ');
  }

  static slugify(str) {
    if (!str || typeof str !== 'string') return '';
    
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  static truncate(str, length = 100, suffix = '...') {
    if (!str || typeof str !== 'string') return str;
    if (str.length <= length) return str;
    
    return str.substring(0, length - suffix.length) + suffix;
  }

  static escapeRegex(str) {
    if (!str || typeof str !== 'string') return str;
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  static normalizeString(str) {
    if (!str || typeof str !== 'string') return str;
    
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  static generateRandomString(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  static generateUniqueId(prefix = '') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 9);
    return `${prefix}${timestamp}${random}`;
  }

  static isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  }

  static extractDomain(url) {
    if (!this.isValidUrl(url)) return null;
    
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
      return null;
    }
  }

  static parseQueryString(queryString) {
    if (!queryString || typeof queryString !== 'string') return {};
    
    const params = {};
    const pairs = queryString.split('&');
    
    pairs.forEach(pair => {
      const [key, value] = pair.split('=');
      if (key) {
        params[decodeURIComponent(key)] = decodeURIComponent(value || '');
      }
    });
    
    return params;
  }

  static toQueryString(params) {
    if (!params || typeof params !== 'object') return '';
    
    return Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
  }

  static maskString(str, visibleStart = 4, visibleEnd = 4, maskChar = '*') {
    if (!str || typeof str !== 'string') return str;
    if (str.length <= visibleStart + visibleEnd) return str;
    
    const start = str.substring(0, visibleStart);
    const end = str.substring(str.length - visibleEnd);
    const middle = maskChar.repeat(str.length - visibleStart - visibleEnd);
    
    return start + middle + end;
  }

  static maskEmail(email) {
    if (!this.isValidEmail(email)) return email;
    
    const [localPart, domain] = email.split('@');
    const maskedLocal = this.maskString(localPart, 2, 1);
    
    return `${maskedLocal}@${domain}`;
  }

  static formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  static formatNumber(num, locale = 'en-US', options = {}) {
    if (typeof num !== 'number') return num;
    
    return num.toLocaleString(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      ...options
    });
  }

  static pluralize(count, singular, plural = null) {
    if (count === 1) return singular;
    
    if (plural) {
      return plural;
    }
    
    if (singular.endsWith('y')) {
      return singular.slice(0, -1) + 'ies';
    }
    
    if (singular.endsWith('s') || singular.endsWith('x') || singular.endsWith('z') || 
        singular.endsWith('ch') || singular.endsWith('sh')) {
      return singular + 'es';
    }
    
    return singular + 's';
  }

  static countWords(str) {
    if (!str || typeof str !== 'string') return 0;
    
    return str.trim().split(/\s+/).length;
  }

  static countCharacters(str, countSpaces = true) {
    if (!str || typeof str !== 'string') return 0;
    
    if (countSpaces) {
      return str.length;
    }
    
    return str.replace(/\s/g, '').length;
  }

  static removeExtraSpaces(str) {
    if (!str || typeof str !== 'string') return str;
    
    return str.replace(/\s+/g, ' ').trim();
  }

  static removeDiacritics(str) {
    if (!str || typeof str !== 'string') return str;
    
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  static toCamelCase(str) {
    if (!str || typeof str !== 'string') return str;
    
    return str
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
  }

  static toSnakeCase(str) {
    if (!str || typeof str !== 'string') return str;
    
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[\s-]+/g, '_')
      .toLowerCase();
  }

  static toKebabCase(str) {
    if (!str || typeof str !== 'string') return str;
    
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  static toTitleCase(str) {
    if (!str || typeof str !== 'string') return str;
    
    const smallWords = /^(a|an|and|as|at|but|by|en|for|if|in|nor|of|on|or|per|the|to|v\.?|vs\.?|via)$/i;
    const alphanumericPattern = /([A-Za-z0-9\u00C0-\u00FF])/;
    
    return str.split(' ').map((word, index, words) => {
      if (index > 0 && index < words.length - 1 && smallWords.test(word)) {
        return word.toLowerCase();
      }
      
      if (word.substring(1).search(/[A-Z]|\../) > -1) {
        return word;
      }
      
      return word.replace(alphanumericPattern, (chr) => chr.toUpperCase());
    }).join(' ');
  }

  static generateHash(str) {
    if (!str || typeof str !== 'string') return '';
    
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return Math.abs(hash).toString(16);
  }
}

module.exports = StringUtils;