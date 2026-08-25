const fs = require('fs');
const path = require('path');

// Leer el archivo .env manualmente
const envPath = path.join(__dirname, '.env');
let envVars = {};

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('=== PM2: Reading .env file ===');
  console.log('Env file path:', envPath);
  console.log('Env file exists:', fs.existsSync(envPath));
  console.log('Env file content:');
  console.log(envContent);
  console.log('=== PM2: Parsed variables ===');
  
  envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value.length > 0) {
      const cleanKey = key.trim();
      const cleanValue = value.join('=').trim();
      envVars[cleanKey] = cleanValue;
      console.log(`${cleanKey}: ${cleanValue}`);
    }
  });
  
  console.log('=== PM2: Final env object ===');
  console.log(JSON.stringify(envVars, null, 2));
} catch (error) {
  console.log('Error reading .env:', error);
}

module.exports = {
  apps: [{
    name: 'nutriunai',
    script: 'npm',
    args: 'start',
    cwd: __dirname,
    env: envVars,
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    merge_logs: true,
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    pre_start: 'npm run build'
  }]
};
