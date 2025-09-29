#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Configuration
const COMMIT_MESSAGE = 'Auto-commit: Game interactions updates';
const WATCH_DIRECTORIES = [
  'src/',
  'public/',
  'index.html',
  'package.json',
  'tailwind.config.js',
  'postcss.config.js',
  'vite.config.ts'
];

// Files to ignore
const IGNORE_PATTERNS = [
  'node_modules/',
  '.git/',
  'dist/',
  '.DS_Store',
  '*.log',
  '.env.local',
  '.env.development.local',
  '.env.production.local'
];

function shouldIgnoreFile(filePath) {
  return IGNORE_PATTERNS.some(pattern => {
    if (pattern.endsWith('/')) {
      return filePath.includes(pattern);
    }
    if (pattern.startsWith('*')) {
      const ext = pattern.substring(1);
      return filePath.endsWith(ext);
    }
    return filePath.includes(pattern);
  });
}

function getGitStatus() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    return status.trim().split('\n').filter(line => line.length > 0);
  } catch (error) {
    console.log('Not a git repository or git not available');
    return [];
  }
}

function hasRelevantChanges() {
  const changes = getGitStatus();
  return changes.some(change => {
    const filePath = change.substring(3); // Remove status prefix
    return WATCH_DIRECTORIES.some(dir => {
      if (dir.endsWith('/')) {
        return filePath.startsWith(dir);
      }
      return filePath === dir || filePath.startsWith(dir + '/');
    }) && !shouldIgnoreFile(filePath);
  });
}

function commitChanges() {
  try {
    console.log('🔄 Auto-committing changes...');
    
    // Add all changes
    execSync('git add .', { stdio: 'inherit' });
    
    // Check if there are changes to commit
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim().length === 0) {
      console.log('✅ No changes to commit');
      return;
    }
    
    // Commit with timestamp
    const timestamp = new Date().toISOString();
    const message = `${COMMIT_MESSAGE} - ${timestamp}`;
    
    execSync(`git commit -m "${message}"`, { stdio: 'inherit' });
    console.log('✅ Changes committed successfully!');
    
  } catch (error) {
    console.error('❌ Error committing changes:', error.message);
  }
}

function watchForChanges() {
  console.log('👀 Watching for changes...');
  console.log('📁 Watching directories:', WATCH_DIRECTORIES.join(', '));
  console.log('🚫 Ignoring:', IGNORE_PATTERNS.join(', '));
  console.log('Press Ctrl+C to stop\n');
  
  let timeout;
  
  // Watch for file changes
  WATCH_DIRECTORIES.forEach(dir => {
    if (fs.existsSync(dir)) {
      fs.watch(dir, { recursive: true }, (eventType, filename) => {
        if (filename && !shouldIgnoreFile(filename)) {
          console.log(`📝 File changed: ${filename}`);
          
          // Debounce commits to avoid too many commits
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            if (hasRelevantChanges()) {
              commitChanges();
            }
          }, 2000); // Wait 2 seconds after last change
        }
      });
    }
  });
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Auto-commit script started');
  console.log('📝 Commit message:', COMMIT_MESSAGE);
  console.log('');
  
  // Check if we're in a git repository
  try {
    execSync('git status', { stdio: 'pipe' });
  } catch (error) {
    console.error('❌ Not a git repository. Please initialize git first:');
    console.error('   git init');
    console.error('   git add .');
    console.error('   git commit -m "Initial commit"');
    process.exit(1);
  }
  
  // Start watching
  watchForChanges();
}

export { commitChanges, hasRelevantChanges, watchForChanges };
