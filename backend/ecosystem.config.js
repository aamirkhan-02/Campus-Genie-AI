// PM2 Process Manager Configuration
module.exports = {
  apps: [
    {
      name: 'studybuddy-api',
      script: 'server.js',
      instances: 'max',           // Use all CPU cores
      exec_mode: 'cluster',       // Cluster mode for load balancing
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      
      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },

      // Logging
      log_file: './logs/combined.log',
      error_file: './logs/error.log',
      out_file: './logs/output.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000,
      shutdown_with_message: true,

      // Restart policies
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,

      // Monitoring
      monitoring: false
    }
  ]
};