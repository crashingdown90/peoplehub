// =============================================================================
// PeopleHub PM2 Ecosystem Configuration
// =============================================================================
//
// Usage:
//   pm2 start ecosystem.config.js
//   pm2 start ecosystem.config.js --env staging
//   pm2 start ecosystem.config.js --env production
//
// Commands:
//   pm2 reload peoplehub           - Zero-downtime restart
//   pm2 logs peoplehub             - View logs
//   pm2 monit                      - Monitor all processes
//   pm2 save                       - Save process list
//   pm2 startup                    - Generate startup script
// =============================================================================

module.exports = {
    apps: [
        {
            // Application name
            name: 'peoplehub',

            // Start script
            script: 'npm',
            args: 'start',

            // Working directory
            cwd: '/var/www/peoplehub',

            // Cluster mode settings
            instances: 'max',  // Use all available CPUs
            exec_mode: 'cluster',

            // Environment variables (default - development)
            env: {
                NODE_ENV: 'development',
                PORT: 3000,
            },

            // Staging environment
            env_staging: {
                NODE_ENV: 'staging',
                PORT: 3000,
            },

            // Production environment
            env_production: {
                NODE_ENV: 'production',
                PORT: 3000,
            },

            // Logging configuration
            log_file: '/var/log/peoplehub/combined.log',
            out_file: '/var/log/peoplehub/out.log',
            error_file: '/var/log/peoplehub/error.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,

            // Restart configuration
            max_restarts: 10,
            min_uptime: '10s',
            restart_delay: 4000,

            // Memory limit (restart if exceeded)
            max_memory_restart: '1G',

            // Watching (disable in production)
            watch: false,
            ignore_watch: [
                'node_modules',
                '.git',
                '.next',
                'logs',
                'uploads',
                '*.log',
            ],

            // Graceful shutdown
            kill_timeout: 5000,
            wait_ready: true,
            listen_timeout: 10000,

            // Auto-restart on crash
            autorestart: true,

            // Cron-based restart (optional, for memory leak mitigation)
            // cron_restart: '0 4 * * *',  // Restart daily at 4 AM

            // Source map support for better error traces
            source_map_support: true,

            // Post-update actions (for pm2 deploy)
            post_update: [
                'npm install',
                'npx prisma generate',
                'npm run build',
            ],
        },
    ],

    // Deployment configuration (for pm2 deploy)
    deploy: {
        staging: {
            user: 'deploy',
            host: 'staging.peoplehub.kreatifindo.com',
            ref: 'origin/develop',
            repo: 'git@github.com:kreatifindo/peoplehub.git',
            path: '/var/www/peoplehub',
            'pre-deploy-local': '',
            'post-deploy': 'npm ci && npx prisma generate && npx prisma migrate deploy && npm run build && pm2 reload ecosystem.config.js --env staging',
            'pre-setup': '',
            env: {
                NODE_ENV: 'staging',
            },
        },
        production: {
            user: 'deploy',
            host: 'peoplehub.kreatifindo.com',
            ref: 'origin/main',
            repo: 'git@github.com:kreatifindo/peoplehub.git',
            path: '/var/www/peoplehub',
            'pre-deploy-local': '',
            'post-deploy': 'npm ci && npx prisma generate && npx prisma migrate deploy && npm run build && pm2 reload ecosystem.config.js --env production',
            'pre-setup': '',
            env: {
                NODE_ENV: 'production',
            },
        },
    },
};
