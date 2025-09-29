export default {
  // Commit message template
  commitMessage: 'Auto-commit: Game interactions updates',
  
  // Directories and files to watch
  watchPaths: [
    'src/',
    'public/',
    'index.html',
    'package.json',
    'tailwind.config.js',
    'postcss.config.js',
    'vite.config.ts',
    'tsconfig.json',
    'eslint.config.js'
  ],
  
  // Files to ignore
  ignorePatterns: [
    'node_modules/',
    '.git/',
    'dist/',
    '.DS_Store',
    '*.log',
    '.env.local',
    '.env.development.local',
    '.env.production.local',
    'auto-commit.js',
    'auto-commit.config.js'
  ],
  
  // Commit settings
  commitSettings: {
    // Debounce time in milliseconds (wait this long after last change)
    debounceTime: 2000,
    
    // Maximum commits per hour (0 = unlimited)
    maxCommitsPerHour: 10,
    
    // Include timestamp in commit message
    includeTimestamp: true,
    
    // Auto-push after commit (be careful with this!)
    autoPush: false
  },
  
  // Git settings
  gitSettings: {
    // Branch to commit to
    branch: 'main',
    
    // Author name for auto-commits
    authorName: 'Auto-commit Bot',
    authorEmail: 'auto-commit@game-interactions.local'
  }
};
