/**
 * SDUI Config Function
 * Returns SDUI page configuration from the database
 * 
 * HTTP Trigger: GET /api/sdui/config?path=/dashboard
 */

const { Pool } = require('pg');

// Connection to PgBouncer (not PostgreSQL directly)
const pool = new Pool({
    host: process.env.DB_HOST || 'pgbouncer.database.svc.cluster.local',
    port: parseInt(process.env.DB_PORT || '6432'),
    database: process.env.DB_NAME || 'sdui_db',
    user: process.env.DB_USER || 'sdui_admin',
    password: process.env.DB_PASSWORD,
    max: 1, // Single connection per function instance
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
});

/**
 * Main handler function
 */
module.exports = async function (context) {
    const path = context.request.query.path || '/';

    try {
        // Fetch SDUI config from database
        const result = await pool.query(
            `SELECT 
                id,
                path,
                title,
                config,
                mfe_name,
                version,
                updated_at
            FROM sdui_pages 
            WHERE path = $1 AND active = true
            ORDER BY version DESC
            LIMIT 1`,
            [path]
        );

        if (result.rows.length === 0) {
            return {
                status: 404,
                body: {
                    error: 'Page not found',
                    path: path
                },
                headers: { 'Content-Type': 'application/json' }
            };
        }

        const page = result.rows[0];

        return {
            status: 200,
            body: {
                success: true,
                data: {
                    id: page.id,
                    path: page.path,
                    title: page.title,
                    mfeName: page.mfe_name,
                    version: page.version,
                    config: page.config,
                    updatedAt: page.updated_at
                }
            },
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=60'
            }
        };

    } catch (error) {
        console.error('Database error:', error);
        return {
            status: 500,
            body: {
                error: 'Internal server error',
                message: error.message
            },
            headers: { 'Content-Type': 'application/json' }
        };
    }
};
