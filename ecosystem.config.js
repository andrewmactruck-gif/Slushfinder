// PM2 Process Config — Slush Finder
// Keeps the app running 24/7 and restarts it if it crashes
//
// Usage:
//   pm2 start ecosystem.config.js
//   pm2 reload ecosystem.config.js   ← zero-downtime update
//   pm2 save && pm2 startup          ← survive reboots

module.exports = {
  apps: [{
    name:        'slushfinder',
    script:      'node_modules/.bin/next',
    args:        'start',
    cwd:         '/var/www/slushfinder',
    env: {
      NODE_ENV: 'production',
      PORT:     3000,
    },
    max_memory_restart: '512M',
    node_args:          '--max_old_space_size=512',
    out_file:           '/var/log/pm2/slushfinder-out.log',
    error_file:         '/var/log/pm2/slushfinder-error.log',
    log_date_format:    'YYYY-MM-DD HH:mm:ss',
    merge_logs:         true,
    restart_delay:      3000,
    max_restarts:       10,
    min_uptime:         '10s',
    watch:              false,
    kill_timeout:       5000,
  }],
}
