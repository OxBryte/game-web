# 🤖 Auto-Commit Setup

This project includes an automatic commit system that will commit your changes as you work.

## 🚀 Quick Start

### Option 1: Run with Development Server
```bash
yarn dev-with-commit
```
This runs both the development server and auto-commit watcher simultaneously.

### Option 2: Run Auto-Commit Only
```bash
yarn auto-commit
```
This runs only the auto-commit watcher.

### Option 3: Manual Commit
```bash
yarn auto-commit --manual
```
This commits current changes without watching for new ones.

## 📁 What Gets Watched

The auto-commit system watches these directories and files:
- `src/` - All source code
- `public/` - Public assets
- `index.html` - Main HTML file
- `package.json` - Dependencies
- `tailwind.config.js` - Tailwind configuration
- `postcss.config.js` - PostCSS configuration
- `vite.config.ts` - Vite configuration
- `tsconfig.json` - TypeScript configuration
- `eslint.config.js` - ESLint configuration

## 🚫 What Gets Ignored

These files and directories are ignored:
- `node_modules/` - Dependencies
- `.git/` - Git metadata
- `dist/` - Build output
- `.DS_Store` - macOS system files
- `*.log` - Log files
- `.env.*` - Environment files
- Auto-commit files themselves

## ⚙️ Configuration

Edit `auto-commit.config.js` to customize:
- Commit message template
- Watch paths
- Ignore patterns
- Debounce time
- Maximum commits per hour
- Auto-push settings

## 🔧 Git Hooks

A pre-commit hook is installed that automatically commits changes before any manual commit.

## 📝 Commit Messages

Auto-commits use this format:
```
Auto-commit: Game interactions updates - 2024-01-15 14:30:25
```

## 🛠️ Manual Control

### Stop Auto-Commit
Press `Ctrl+C` in the terminal running auto-commit.

### Disable Git Hooks
```bash
chmod -x .git/hooks/pre-commit
```

### Re-enable Git Hooks
```bash
chmod +x .git/hooks/pre-commit
```

## ⚠️ Important Notes

1. **Review Commits**: Always review auto-commits before pushing
2. **Sensitive Data**: Don't commit sensitive information
3. **Large Files**: The system ignores common large file patterns
4. **Branch Safety**: Auto-commit works on the current branch
5. **Backup**: Keep regular backups of your work

## 🐛 Troubleshooting

### Auto-commit not working?
1. Check if you're in a git repository: `git status`
2. Ensure files are being watched: Check console output
3. Verify permissions: `ls -la .git/hooks/`

### Too many commits?
1. Increase `debounceTime` in config
2. Add more files to `ignorePatterns`
3. Use `maxCommitsPerHour` limit

### Want to disable temporarily?
```bash
# Stop the process
Ctrl+C

# Or disable git hooks
chmod -x .git/hooks/pre-commit
```

## 📊 Monitoring

The auto-commit system provides console output:
- 📝 File change notifications
- 🔄 Commit progress
- ✅ Success confirmations
- ❌ Error messages

## 🔄 Integration with Development

The auto-commit system is designed to work seamlessly with:
- Vite development server
- Hot module replacement
- TypeScript compilation
- ESLint checking
- Tailwind CSS compilation

Enjoy your automated workflow! 🎉
