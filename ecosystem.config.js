module.exports = {
  apps: [{
    name: 'nutriunai',
    script: 'npm',
    args: 'start',
    cwd: __dirname,
    env_file: '/home/pi/NutriUnai/.env',
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
