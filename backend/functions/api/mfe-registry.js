/**
 * MFE Registry Function
 * Returns the list of available MFEs for dynamic loading
 * 
 * HTTP Trigger: GET /api/mfe/registry
 */

const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'pgbouncer.database.svc.cluster.local',
    port: parseInt(process.env.DB_PORT || '6432'),
    database: process.env.DB_NAME || 'sdui_db',
    user: process.env.DB_USER || 'sdui_admin',
    password: process.env.DB_PASSWORD,
    max: 1,
});

module.exports = async function (context) {
    const name = context.request.query.name;

    try {
        let query, params;

        if (name) {
            // Get specific MFE
            query = `
                SELECT name, source, integrity, version, variables, description
                FROM mfe_registry
                WHERE name = $1 AND active = true
            `;
            params = [name];
        } else {
            // Get all MFEs
            query = `
                SELECT name, source, integrity, version, variables, description
                FROM mfe_registry
                WHERE active = true
                ORDER BY name
            `;
            params = [];
        }

        const result = await pool.query(query, params);

        if (name && result.rows.length === 0) {
            return {
                status: 404,
                body: { error: 'MFE not found', name },
                headers: { 'Content-Type': 'application/json' }
            };
        }

        // Transform to registry format
        const mfes = {};
        result.rows.forEach(row => {
            mfes[row.name] = {
                source: row.source,
                integrity: row.integrity,
                version: row.version,
                variables: row.variables || {},
                description: row.description
            };
        });

        return {
            status: 200,
            body: {
                mfes,
                generatedAt: new Date().toISOString()
            },
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=300'
            }
        };

    } catch (error) {
        console.error('Database error:', error);
        return {
            status: 500,
            body: { error: 'Internal server error' },
            headers: { 'Content-Type': 'application/json' }
        };
    }
};
