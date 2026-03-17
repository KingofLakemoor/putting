const { execSync } = require('child_process');
execSync('npm start &');
setTimeout(() => {
  execSync('curl http://localhost:3000');
  process.exit(0);
}, 5000);
