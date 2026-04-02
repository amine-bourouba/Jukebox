module.exports = {
  apps: [
    {
      name: 'jukebox-api',
      script: 'dist/main.js',
      // Keep at 1 — multiple instances would cause duplicate cron scans
      instances: 1,
      autorestart: true,
      watch: false,
      env_production: {
        NODE_ENV: 'production',
      },
      error_file: 'logs/error.log',
      out_file: 'logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
