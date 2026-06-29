const { spawn } = require('node:child_process');

const [logLevel, command, ...args] = process.argv.slice(2);
const allowedLogLevels = new Set(['none', 'summary', 'body']);

if (!allowedLogLevels.has(logLevel) || !command) {
  console.error('Usage: node scripts/run-with-log-level.js <none|summary|body> <command> [...args]');
  process.exit(1);
}

// Forward the selected log level without changing the underlying test command.
const child = spawn(command, args, {
  env: {
    ...process.env,
    API_LOG_LEVEL: logLevel
  },
  shell: process.platform === 'win32',
  stdio: 'inherit'
});

// Propagate the child result so CI receives the correct command status.
child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`Command stopped with signal ${signal}`);
    process.exit(1);
  }
  process.exit(code ?? 1);
});
