const { Parser } = require('json2csv'); // we may need to install json2csv, but it's not in package.json. Alternative: manually build CSV.
const PDFDocument = require('pdfkit');
const { formatDate } = require('../utils/helpers/date');

/**
 * Export data to CSV
 * @param {Array} data - array of objects
 * @param {Array} fields - fields to include (optional)
 * @returns {string} CSV string
 */
const toCSV = (data, fields) => {
  if (!data || data.length === 0) return '';
  const headers = fields || Object.keys(data[0]);
  const csvRows = [];
  csvRows.push(headers.join(','));

  for (const row of data) {
    const values = headers.map(field => {
      const value = row[field] !== undefined ? row[field] : '';
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }
  return csvRows.join('\n');
};

/**
 * Export data to JSON
 * @param {*} data
 * @returns {string} JSON string
 */
const toJSON = (data) => {
  return JSON.stringify(data, null, 2);
};

/**
 * Generate PDF report from progress data
 * @param {Object} user - user object
 * @param {Array} snapshots - snapshot data
 * @returns {Promise<Buffer>} PDF buffer
 */
const generateProgressPDF = async (user, snapshots) => {
  return new Promise((resolve) => {
    const doc = new PDFDocument();
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    // Add content
    doc.fontSize(20).text(`Progress Report for ${user.displayName || user.username}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated on: ${formatDate(new Date())}`);
    doc.moveDown();

    if (snapshots.length > 0) {
      doc.text('Recent Snapshots:');
      snapshots.forEach(snap => {
        doc.text(`- ${snap.snapshotPeriod} (${formatDate(snap.snapshotDate)}): Solved ${snap.overallProgress?.totalProblemsSolved || 0}`);
      });
    } else {
      doc.text('No snapshots available.');
    }

    doc.end();
  });
};

module.exports = {
  toCSV,
  toJSON,
  generateProgressPDF
};