const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const config = require('../config/environment');
const logger = require('./logger');
const dateUtils = require('./dateUtils');

class ExportUtils {
  constructor() {
    this.formats = {
      json: this.exportToJson.bind(this),
      csv: this.exportToCsv.bind(this),
      pdf: this.exportToPdf.bind(this)
    };
  }

  exportToJson(data, options = {}) {
    try {
      const exportData = this.prepareData(data, options);
      return JSON.stringify(exportData, null, options.pretty ? 2 : 0);
    } catch (error) {
      logger.error('JSON export error:', error);
      throw new Error('Failed to export data as JSON');
    }
  }

  exportToCsv(data, options = {}) {
    try {
      const exportData = this.prepareData(data, options);
      
      if (!Array.isArray(exportData)) {
        throw new Error('CSV export requires array data');
      }

      const fields = options.fields || this.detectFields(exportData[0]);
      const parser = new Parser({ fields });
      
      return parser.parse(exportData);
    } catch (error) {
      logger.error('CSV export error:', error);
      throw new Error('Failed to export data as CSV');
    }
  }

  exportToPdf(data, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        const exportData = this.prepareData(data, options);
        const chunks = [];
        
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: options.title || 'DevRhythm Export',
            Author: 'DevRhythm',
            Subject: options.subject || 'Data Export',
            Keywords: options.keywords || 'devrhythm, coding, practice',
            CreationDate: new Date()
          }
        });

        doc.on('data', chunks.push.bind(chunks));
        doc.on('end', () => {
          const result = Buffer.concat(chunks);
          resolve(result);
        });

        this.generatePdfContent(doc, exportData, options);
        doc.end();
      } catch (error) {
        logger.error('PDF export error:', error);
        reject(new Error('Failed to export data as PDF'));
      }
    });
  }

  prepareData(data, options) {
    let exportData = data;
    
    if (options.transform && typeof options.transform === 'function') {
      exportData = options.transform(data);
    }
    
    if (options.filter && typeof options.filter === 'function') {
      if (Array.isArray(exportData)) {
        exportData = exportData.filter(options.filter);
      }
    }
    
    if (options.sort && Array.isArray(exportData)) {
      exportData.sort(options.sort);
    }
    
    if (options.limit && Array.isArray(exportData)) {
      exportData = exportData.slice(0, options.limit);
    }
    
    return exportData;
  }

  detectFields(data) {
    if (!data || typeof data !== 'object') {
      return [];
    }
    
    const fields = [];
    
    const extractFields = (obj, prefix = '') => {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const value = obj[key];
          const fieldName = prefix ? `${prefix}.${key}` : key;
          
          if (value === null || value === undefined) {
            fields.push(fieldName);
          } else if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
            extractFields(value, fieldName);
          } else {
            fields.push(fieldName);
          }
        }
      }
    };
    
    extractFields(data);
    return fields;
  }

  generatePdfContent(doc, data, options) {
    const title = options.title || 'DevRhythm Export';
    const subtitle = options.subtitle || `Generated on ${dateUtils.format(new Date(), 'human')}`;
    
    doc.fontSize(24).text(title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(subtitle, { align: 'center' });
    doc.moveDown(2);
    
    if (Array.isArray(data)) {
      this.generateTable(doc, data, options);
    } else if (typeof data === 'object') {
      this.generateKeyValue(doc, data, options);
    } else {
      doc.fontSize(14).text('No data to display', { align: 'center' });
    }
    
    this.addFooter(doc, options);
  }

  generateTable(doc, data, options) {
    if (!data || data.length === 0) {
      doc.fontSize(14).text('No data available', { align: 'center' });
      return;
    }
    
    const headers = options.headers || Object.keys(data[0] || {});
    const columnWidths = this.calculateColumnWidths(headers, data, doc);
    
    let y = doc.y;
    const rowHeight = 20;
    const headerColor = '#f0f0f0';
    
    doc.rect(50, y, 500, rowHeight).fill(headerColor);
    
    headers.forEach((header, i) => {
      const x = 50 + columnWidths.slice(0, i).reduce((sum, width) => sum + width + 10, 0);
      doc.fillColor('#000000').fontSize(10).text(
        header.charAt(0).toUpperCase() + header.slice(1),
        x,
        y + 5,
        { width: columnWidths[i], align: 'left' }
      );
    });
    
    y += rowHeight;
    
    data.forEach((row, rowIndex) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
        
        doc.rect(50, y, 500, rowHeight).fill(headerColor);
        headers.forEach((header, i) => {
          const x = 50 + columnWidths.slice(0, i).reduce((sum, width) => sum + width + 10, 0);
          doc.fillColor('#000000').fontSize(10).text(
            header.charAt(0).toUpperCase() + header.slice(1),
            x,
            y + 5,
            { width: columnWidths[i], align: 'left' }
          );
        });
        y += rowHeight;
      }
      
      headers.forEach((header, i) => {
        const x = 50 + columnWidths.slice(0, i).reduce((sum, width) => sum + width + 10, 0);
        const value = this.extractValue(row, header);
        const displayValue = this.formatValueForDisplay(value);
        
        doc.fillColor('#333333').fontSize(9).text(
          displayValue,
          x,
          y + 5,
          { width: columnWidths[i], align: 'left' }
        );
      });
      
      y += rowHeight;
      
      if (rowIndex < data.length - 1) {
        doc.moveTo(50, y).lineTo(550, y).strokeColor('#cccccc').stroke();
      }
    });
    
    doc.y = y + 20;
  }

  calculateColumnWidths(headers, data, doc) {
    const minWidth = 60;
    const maxWidth = 150;
    const columnWidths = headers.map(() => minWidth);
    
    headers.forEach((header, i) => {
      let maxTextWidth = doc.widthOfString(header, { fontSize: 10 });
      
      data.forEach(row => {
        const value = this.extractValue(row, header);
        const displayValue = this.formatValueForDisplay(value);
        const textWidth = doc.widthOfString(displayValue, { fontSize: 9 });
        maxTextWidth = Math.max(maxTextWidth, textWidth);
      });
      
      columnWidths[i] = Math.min(Math.max(minWidth, maxTextWidth + 10), maxWidth);
    });
    
    const totalWidth = columnWidths.reduce((sum, width) => sum + width + 10, 0);
    
    if (totalWidth > 500) {
      const scale = 500 / totalWidth;
      return columnWidths.map(width => Math.floor(width * scale));
    }
    
    return columnWidths;
  }

  extractValue(row, path) {
    if (!row) return '';
    
    if (!path.includes('.')) {
      return row[path];
    }
    
    const parts = path.split('.');
    let value = row;
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return '';
      }
    }
    
    return value;
  }

  formatValueForDisplay(value) {
    if (value === null || value === undefined) {
      return '';
    }
    
    if (value instanceof Date) {
      return dateUtils.format(value, 'short');
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value).substring(0, 50);
    }
    
    return String(value).substring(0, 100);
  }

  generateKeyValue(doc, data, options) {
    const keys = Object.keys(data);
    let y = doc.y;
    
    keys.forEach((key, index) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
      
      const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
      const value = data[key];
      const displayValue = this.formatValueForDisplay(value);
      
      doc.fontSize(10).fillColor('#666666').text(`${label}:`, 50, y, { width: 150, align: 'left' });
      doc.fontSize(10).fillColor('#000000').text(displayValue, 210, y, { width: 340, align: 'left' });
      
      y += 20;
    });
    
    doc.y = y + 20;
  }

  addFooter(doc, options) {
    const pageCount = doc.bufferedPageRange().count;
    
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      
      doc.fontSize(8).fillColor('#666666').text(
        `Page ${i + 1} of ${pageCount}`,
        50,
        800,
        { width: 500, align: 'center' }
      );
      
      doc.text(
        `Generated by DevRhythm • ${dateUtils.format(new Date(), 'human')}`,
        50,
        815,
        { width: 500, align: 'center' }
      );
      
      if (options.watermark) {
        doc.save();
        doc.opacity(0.1);
        doc.fontSize(72).fillColor('#000000').text(
          'DevRhythm',
          0,
          300,
          { width: 600, align: 'center', angle: 45 }
        );
        doc.restore();
      }
    }
  }

  exportQuestions(questions, format, options = {}) {
    const exportData = questions.map(q => ({
      'Question ID': q._id,
      'Title': q.title,
      'Difficulty': q.difficulty,
      'Platform': q.platform,
      'Status': q.status,
      'Tags': Array.isArray(q.tags) ? q.tags.join(', ') : q.tags,
      'Company Tags': Array.isArray(q.companyTags) ? q.companyTags.join(', ') : q.companyTags,
      'Confidence Score': q.confidenceScore,
      'Personal Rating': q.personalRating,
      'Solved At': q.solvedAt ? dateUtils.format(q.solvedAt, 'short') : '',
      'Created At': dateUtils.format(q.createdAt, 'short'),
      'Link': q.primaryLink
    }));
    
    return this.export(exportData, format, {
      title: 'Questions Export',
      subtitle: `Total questions: ${questions.length}`,
      ...options
    });
  }

  exportDays(days, format, options = {}) {
    const exportData = days.map(d => ({
      'Day Number': d.dayNumber,
      'Date': dateUtils.format(d.date, 'date'),
      'Type': d.type,
      'Title': d.title || '',
      'Difficulty Rating': d.difficultyRating || '',
      'Productivity Score': d.productivityScore || '',
      'Questions Total': d.questionStats?.total || 0,
      'Questions Done': d.questionStats?.done || 0,
      'Completion %': d.completionPercentage || 0,
      'Total Time (min)': d.totalTimeSpent || 0,
      'Focus Topics': Array.isArray(d.focusTopics) ? d.focusTopics.join(', ') : '',
      'Completed': d.isCompleted ? 'Yes' : 'No',
      'Created At': dateUtils.format(d.createdAt, 'short')
    }));
    
    return this.export(exportData, format, {
      title: 'Study Days Export',
      subtitle: `Total days: ${days.length}`,
      ...options
    });
  }

  exportAnalytics(analytics, format, options = {}) {
    const exportData = [{
      'Period Type': analytics.periodType,
      'Start Date': dateUtils.format(analytics.periodStart, 'date'),
      'End Date': dateUtils.format(analytics.periodEnd, 'date'),
      'Days Active': analytics.totals?.daysActive || 0,
      'Questions Attempted': analytics.totals?.questionsAttempted || 0,
      'Questions Solved': analytics.totals?.questionsSolved || 0,
      'Time Spent (min)': analytics.totals?.timeSpent || 0,
      'Revisions Completed': analytics.totals?.revisionsCompleted || 0,
      'Easy Accuracy': analytics.byDifficulty?.easy?.accuracy || 0,
      'Medium Accuracy': analytics.byDifficulty?.medium?.accuracy || 0,
      'Hard Accuracy': analytics.byDifficulty?.hard?.accuracy || 0,
      'Current Streak': analytics.streakData?.currentStreak || 0,
      'Longest Streak': analytics.streakData?.longestStreak || 0,
      'Consistency Score': analytics.streakData?.consistencyScore || 0,
      'Generated At': dateUtils.format(analytics.createdAt, 'short')
    }];
    
    return this.export(exportData, format, {
      title: 'Analytics Export',
      subtitle: `${analytics.periodType} report`,
      ...options
    });
  }

  export(data, format, options = {}) {
    const exporter = this.formats[format.toLowerCase()];
    
    if (!exporter) {
      throw new Error(`Unsupported export format: ${format}`);
    }
    
    return exporter(data, options);
  }

  getSupportedFormats() {
    return Object.keys(this.formats);
  }

  getContentType(format) {
    const contentTypes = {
      json: 'application/json',
      csv: 'text/csv',
      pdf: 'application/pdf'
    };
    
    return contentTypes[format.toLowerCase()] || 'application/octet-stream';
  }

  getFileExtension(format) {
    const extensions = {
      json: '.json',
      csv: '.csv',
      pdf: '.pdf'
    };
    
    return extensions[format.toLowerCase()] || '.txt';
  }

  generateFilename(prefix, format, timestamp = new Date()) {
    const dateStr = dateUtils.format(timestamp, 'date');
    const timeStr = dateUtils.format(timestamp, 'time').replace(/:/g, '-');
    const extension = this.getFileExtension(format);
    
    return `${prefix}_${dateStr}_${timeStr}${extension}`;
  }
}

const exportUtils = new ExportUtils();
module.exports = exportUtils;