const json2csv = require('json2csv').Parser;
const logger = require('./logger');

class ExportUtils {
  static async toCSV(data, fields, options = {}) {
    try {
      const parser = new json2csv({
        fields,
        delimiter: options.delimiter || ',',
        quote: options.quote || '"',
        excelStrings: options.excelStrings || false,
        withBOM: options.withBOM || false
      });

      return parser.parse(data);
    } catch (error) {
      logger.error('CSV export error:', error);
      throw error;
    }
  }

  static async toJSON(data, options = {}) {
    try {
      const replacer = options.replacer || null;
      const space = options.space || 2;
      return JSON.stringify(data, replacer, space);
    } catch (error) {
      logger.error('JSON export error:', error);
      throw error;
    }
  }

  static flattenObject(obj, prefix = '') {
    const flattened = {};
    
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(flattened, this.flattenObject(value, newKey));
      } else if (Array.isArray(value)) {
        flattened[newKey] = value.join('; ');
      } else {
        flattened[newKey] = value;
      }
    });
    
    return flattened;
  }

  static getCSVFields(data, sampleSize = 10) {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }
    
    const samples = data.slice(0, Math.min(sampleSize, data.length));
    const allKeys = new Set();
    
    samples.forEach(item => {
      const flattened = this.flattenObject(item);
      Object.keys(flattened).forEach(key => allKeys.add(key));
    });
    
    return Array.from(allKeys).sort();
  }

  static formatDateForExport(date, format = 'iso') {
    if (!date) return '';
    
    const d = new Date(date);
    
    switch (format) {
      case 'iso':
        return d.toISOString();
      case 'date':
        return d.toLocaleDateString();
      case 'datetime':
        return d.toLocaleString();
      case 'timestamp':
        return d.getTime();
      default:
        return d.toISOString();
    }
  }

  static formatNumberForExport(num, decimals = 2) {
    if (typeof num !== 'number') return num;
    
    if (Number.isInteger(num)) {
      return num.toString();
    }
    
    return num.toFixed(decimals);
  }

  static sanitizeForExport(data) {
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeForExport(item));
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };
      
      const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
      
      sensitiveFields.forEach(field => {
        if (sanitized[field]) {
          sanitized[field] = '***REDACTED***';
        }
      });
      
      Object.keys(sanitized).forEach(key => {
        if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
          sanitized[key] = this.sanitizeForExport(sanitized[key]);
        }
      });
      
      return sanitized;
    }
    
    return data;
  }

  static generateExportFilename(prefix = 'export', extension = 'csv') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${prefix}_${timestamp}.${extension}`;
  }

  static async chunkData(data, chunkSize = 1000) {
    const chunks = [];
    
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }
    
    return chunks;
  }

  static async mergeChunks(chunks, format = 'csv') {
    if (format === 'csv') {
      const header = chunks[0].split('\n')[0];
      const body = chunks.map(chunk => {
        const lines = chunk.split('\n');
        return lines.slice(1).join('\n');
      }).join('\n');
      
      return `${header}\n${body}`;
    } else if (format === 'json') {
      const parsedChunks = chunks.map(chunk => JSON.parse(chunk));
      return JSON.stringify(parsedChunks.flat());
    }
    
    throw new Error(`Unsupported format: ${format}`);
  }

  static getExportContentType(format) {
    switch (format) {
      case 'csv':
        return 'text/csv';
      case 'json':
        return 'application/json';
      case 'pdf':
        return 'application/pdf';
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      default:
        return 'application/octet-stream';
    }
  }

  static validateExportData(data, format) {
    if (!data || (Array.isArray(data) && data.length === 0)) {
      throw new Error('No data to export');
    }
    
    if (format === 'csv' && !Array.isArray(data)) {
      throw new Error('CSV export requires array data');
    }
    
    if (format === 'json' && typeof data !== 'object') {
      throw new Error('JSON export requires object data');
    }
    
    return true;
  }
}

module.exports = ExportUtils;