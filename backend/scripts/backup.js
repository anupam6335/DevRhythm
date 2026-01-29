const mongoose = require('../src/config/database');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const backupDir = path.join(__dirname, '../backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const backupDatabase = async () => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `backup-${timestamp}.gz`);
    
    const config = require('../src/config');
    const mongoUri = new URL(config.database.uri);
    const dbName = mongoUri.pathname.substring(1);
    
    const command = `mongodump --uri="${config.database.uri}" --archive="${backupFile}" --gzip`;
    
    await execAsync(command);
    
    console.log(`Backup created: ${backupFile}`);
    
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('backup-'))
      .sort()
      .reverse();
    
    if (files.length > 7) {
      const oldFiles = files.slice(7);
      for (const file of oldFiles) {
        fs.unlinkSync(path.join(backupDir, file));
        console.log(`Deleted old backup: ${file}`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Backup failed:', error);
    process.exit(1);
  }
};

backupDatabase();