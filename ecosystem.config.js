module.exports = {
  apps: [{
    name: 'nutriunai',
    script: 'npm',
    args: 'start',
    cwd: __dirname,
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      OPENAI_API_KEY: 'tu-api-key-aqui',
      JWT_SECRET: 'jqyghGBNub0w5Dr+gHilO6wKdoiYASxNgBNvHUmO7Cs='
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
      OPENAI_API_KEY: 'tu-api-key-aqui',
      JWT_SECRET: 'jqyghGBNub0w5Dr+gHilO6wKdoiYASxNgBNvHUmO7Cs='
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    env_file: '.env',
    merge_logs: true,
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    pre_start: 'npm run build'
  }]
};
