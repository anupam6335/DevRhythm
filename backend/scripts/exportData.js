const mongoose = require('../src/config/database');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const config = require('../src/config');

const exportDir = path.join(__dirname, '../data-exports');
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true });
}

const exportDatabase = async () => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportPath = path.join(exportDir, `devrhythm-export-${timestamp}`);
    
    if (!fs.existsSync(exportPath)) {
      fs.mkdirSync(exportPath, { recursive: true });
    }

    console.log('Starting DevRhythm database export...');
    
    // Method 1: Using mongodump (Recommended for full backup)
    try {
      const mongoUri = config.database.uri;
      const dumpCommand = `mongodump --uri="${mongoUri}" --out="${exportPath}"`;
      
      console.log('Executing mongodump...');
      await execAsync(dumpCommand);
      console.log('✅ mongodump completed successfully');
    } catch (mongodumpError) {
      console.log('⚠️ mongodump failed, using manual export...', mongodumpError.message);
      
      // Method 2: Manual export using Node.js
      await manualExport(exportPath, timestamp);
    }

    // Create a summary report
    await createExportSummary(exportPath, timestamp);
    
    console.log(`✅ Export completed successfully!`);
    console.log(`📁 Export location: ${exportPath}`);
    console.log(`📊 Files created:`);
    
    const files = fs.readdirSync(exportPath);
    files.forEach(file => {
      const filePath = path.join(exportPath, file);
      const stats = fs.statSync(filePath);
      if (stats.isFile()) {
        console.log(`   - ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
      } else if (stats.isDirectory()) {
        const subFiles = fs.readdirSync(filePath).length;
        console.log(`   - ${file}/ (${subFiles} files)`);
      }
    });

    // Zip the export
    await zipExport(exportPath, timestamp);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
};

const manualExport = async (exportPath, timestamp) => {
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  
  console.log(`Found ${collections.length} collections`);
  
  const exportResults = [];
  
  for (const collectionInfo of collections) {
    const collectionName = collectionInfo.name;
    console.log(`Exporting collection: ${collectionName}`);
    
    const collection = db.collection(collectionName);
    const cursor = collection.find({});
    const documents = [];
    
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      // Convert ObjectId and Date to strings for JSON
      const processedDoc = JSON.parse(JSON.stringify(doc, (key, value) => {
        if (value && value._id && typeof value._id === 'object') {
          return { ...value, _id: value._id.toString() };
        }
        return value;
      }));
      documents.push(processedDoc);
    }
    
    await cursor.close();
    
    const fileName = `${collectionName}.json`;
    const filePath = path.join(exportPath, fileName);
    
    fs.writeFileSync(filePath, JSON.stringify(documents, null, 2), 'utf8');
    
    exportResults.push({
      collection: collectionName,
      count: documents.length,
      file: fileName,
      size: (Buffer.byteLength(JSON.stringify(documents)) / 1024).toFixed(2)
    });
    
    console.log(`   ✓ Exported ${documents.length} documents to ${fileName}`);
  }
  
  // Save export metadata
  const metadata = {
    exportDate: new Date().toISOString(),
    timestamp: timestamp,
    database: config.database.uri.split('/').pop(),
    collections: exportResults,
    summary: {
      totalCollections: exportResults.length,
      totalDocuments: exportResults.reduce((sum, col) => sum + col.count, 0),
      totalSize: exportResults.reduce((sum, col) => sum + parseFloat(col.size), 0).toFixed(2)
    }
  };
  
  fs.writeFileSync(
    path.join(exportPath, 'export-metadata.json'),
    JSON.stringify(metadata, null, 2),
    'utf8'
  );
  
  return exportResults;
};

const createExportSummary = async (exportPath, timestamp) => {
  const summary = {
    exportInfo: {
      date: new Date().toISOString(),
      timestamp: timestamp,
      app: 'DevRhythm',
      version: '1.0.0'
    },
    databaseInfo: {
      name: config.database.uri.split('/').pop(),
      uri: config.database.uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@') // Hide credentials
    },
    collections: []
  };
  
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  
  for (const collectionInfo of collections) {
    const collectionName = collectionInfo.name;
    const collection = db.collection(collectionName);
    
    const count = await collection.countDocuments();
    const stats = await db.command({ collStats: collectionName });
    
    summary.collections.push({
      name: collectionName,
      count: count,
      sizeMB: (stats.size / 1024 / 1024).toFixed(2),
      storageMB: (stats.storageSize / 1024 / 1024).toFixed(2),
      indexes: stats.nindexes,
      indexSizeMB: (stats.totalIndexSize / 1024 / 1024).toFixed(2)
    });
  }
  
  fs.writeFileSync(
    path.join(exportPath, 'database-summary.json'),
    JSON.stringify(summary, null, 2),
    'utf8'
  );
  
  // Create a readable report
  const reportPath = path.join(exportPath, 'README.md');
  let report = `# DevRhythm Database Export Report\n\n`;
  report += `**Export Date:** ${new Date().toLocaleString()}\n`;
  report += `**Database:** ${summary.databaseInfo.name}\n\n`;
  
  report += `## Collections Summary\n\n`;
  report += `| Collection | Documents | Size (MB) | Storage (MB) | Indexes |\n`;
  report += `|------------|-----------|-----------|--------------|---------|\n`;
  
  summary.collections.forEach(col => {
    report += `| ${col.name} | ${col.count.toLocaleString()} | ${col.sizeMB} | ${col.storageMB} | ${col.indexes} |\n`;
  });
  
  const totalDocs = summary.collections.reduce((sum, col) => sum + col.count, 0);
  const totalSize = summary.collections.reduce((sum, col) => sum + parseFloat(col.sizeMB), 0);
  
  report += `\n**Total:** ${summary.collections.length} collections, ${totalDocs.toLocaleString()} documents, ${totalSize.toFixed(2)} MB\n\n`;
  
  report += `## Export Files\n\n`;
  
  const files = fs.readdirSync(exportPath);
  files.forEach(file => {
    const filePath = path.join(exportPath, file);
    const stats = fs.statSync(filePath);
    if (stats.isFile()) {
      report += `- \`${file}\` (${(stats.size / 1024).toFixed(2)} KB)\n`;
    }
  });
  
  report += `\n## Import Instructions\n\n`;
  report += `### Using mongorestore:\n`;
  report += `\`\`\`bash\n`;
  report += `mongorestore --uri="mongodb://localhost:27017/devrhythm" ./devrhythm-export-${timestamp}/\n`;
  report += `\`\`\`\n\n`;
  
  report += `### Using mongoimport for individual collections:\n`;
  report += `\`\`\`bash\n`;
  report += `# For each collection\n`;
  report += `mongoimport --uri="mongodb://localhost:27017/devrhythm" --collection=users --file=users.json\n`;
  report += `\`\`\`\n`;
  
  fs.writeFileSync(reportPath, report, 'utf8');
  
  console.log('📝 Created export summary and README');
};

const zipExport = async (exportPath, timestamp) => {
  try {
    const zipPath = path.join(exportDir, `devrhythm-export-${timestamp}.zip`);
    
    // Using native zip command (available on most systems)
    const zipCommand = process.platform === 'win32' 
      ? `powershell Compress-Archive -Path "${exportPath}\\*" -DestinationPath "${zipPath}"`
      : `zip -r "${zipPath}" "${exportPath}"`;
    
    console.log('Creating zip archive...');
    await execAsync(zipCommand);
    
    // Get zip file size
    const stats = fs.statSync(zipPath);
    console.log(`✅ Created zip: ${path.basename(zipPath)} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
    
    // Clean up the uncompressed folder
    fs.rmSync(exportPath, { recursive: true, force: true });
    console.log(`🧹 Cleaned up uncompressed folder`);
    
  } catch (error) {
    console.log('⚠️ Could not create zip, keeping uncompressed files:', error.message);
  }
};

// Export individual collections if needed
const exportCollection = async (collectionName) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportPath = path.join(exportDir, `collections-${timestamp}`);
    
    if (!fs.existsSync(exportPath)) {
      fs.mkdirSync(exportPath, { recursive: true });
    }
    
    const db = mongoose.connection.db;
    const collection = db.collection(collectionName);
    
    console.log(`Exporting collection: ${collectionName}`);
    
    const cursor = collection.find({});
    const documents = [];
    
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      documents.push(JSON.parse(JSON.stringify(doc)));
    }
    
    await cursor.close();
    
    const fileName = `${collectionName}.json`;
    const filePath = path.join(exportPath, fileName);
    
    fs.writeFileSync(filePath, JSON.stringify(documents, null, 2), 'utf8');
    
    console.log(`✅ Exported ${documents.length} documents from ${collectionName}`);
    console.log(`📁 Location: ${filePath}`);
    
    return { count: documents.length, filePath };
    
  } catch (error) {
    console.error(`❌ Failed to export ${collectionName}:`, error);
    throw error;
  }
};

// Get collection statistics
const getCollectionStats = async () => {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('\n📊 Database Collections Statistics\n');
    console.log('═'.repeat(80));
    console.log('Collection'.padEnd(25) + 'Documents'.padEnd(15) + 'Size (MB)'.padEnd(15) + 'Indexes');
    console.log('═'.repeat(80));
    
    let totalDocs = 0;
    let totalSize = 0;
    
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      const collection = db.collection(collectionName);
      
      const count = await collection.countDocuments();
      const stats = await db.command({ collStats: collectionName });
      
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      const indexCount = stats.nindexes;
      
      console.log(
        collectionName.padEnd(25) +
        count.toString().padEnd(15) +
        sizeMB.padEnd(15) +
        indexCount
      );
      
      totalDocs += count;
      totalSize += parseFloat(sizeMB);
    }
    
    console.log('═'.repeat(80));
    console.log(`Total: ${collections.length} collections, ${totalDocs.toLocaleString()} documents, ${totalSize.toFixed(2)} MB\n`);
    
    return { collections: collections.length, totalDocs, totalSize };
    
  } catch (error) {
    console.error('❌ Failed to get statistics:', error);
    throw error;
  }
};

// Main function
const main = async () => {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'stats':
      await getCollectionStats();
      break;
      
    case 'collection':
      const collectionName = args[1];
      if (!collectionName) {
        console.error('❌ Please specify collection name: npm run export:collection <collection-name>');
        process.exit(1);
      }
      await exportCollection(collectionName);
      break;
      
    case 'help':
      printHelp();
      break;
      
    default:
      // Full export
      await exportDatabase();
      break;
  }
};

const printHelp = () => {
  console.log(`
📦 DevRhythm Database Export Tool
══════════════════════════════════════

Usage:
  npm run export                     # Export entire database
  npm run export:stats               # Show collection statistics
  npm run export:collection <name>   # Export specific collection
  
Commands:
  export           Full database export with backup and zip
  export:stats     Display database statistics
  export:collection <name> Export specific collection
  
Examples:
  npm run export
  npm run export:stats
  npm run export:collection users
  npm run export:collection questions

Export location: ./data-exports/
`);
};

// Add to package.json scripts
const updatePackageJson = () => {
  const packagePath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  if (!packageJson.scripts['export']) {
    packageJson.scripts['export'] = 'node scripts/exportData.js';
    packageJson.scripts['export:stats'] = 'node scripts/exportData.js stats';
    packageJson.scripts['export:collection'] = 'node scripts/exportData.js collection';
    
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2), 'utf8');
    console.log('✅ Added export scripts to package.json');
  }
};

// Run the script
if (require.main === module) {
  // Update package.json with export scripts
  updatePackageJson();
  
  // Run main function
  main().catch(console.error);
}

module.exports = {
  exportDatabase,
  exportCollection,
  getCollectionStats
};