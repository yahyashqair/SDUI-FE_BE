/**
 * Release Management Function
 * 
 * HTTP Trigger: 
 *   GET /api/releases
 *   POST /api/releases
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
    const method = context.request.method;
    const body = context.request.body;

    try {
        if (method === 'GET') {
            const result = await pool.query('SELECT * FROM releases ORDER BY created_at DESC');
            return {
                status: 200,
                body: { releases: result.rows },
                headers: { 'Content-Type': 'application/json' }
            };
        }
        else if (method === 'POST') {
            const action = context.request.query.action;

            if (action === 'deploy') {
                // Deploy a specific release
                const { id } = body;
                if (!id) return { status: 400, body: { error: 'Release ID required' } };

                // 1. Get the release
                const releaseRes = await pool.query('SELECT * FROM releases WHERE id = $1', [id]);
                if (releaseRes.rows.length === 0) return { status: 404, body: { error: 'Release not found' } };
                const release = releaseRes.rows[0];
                const artifacts = release.artifacts; // JSON object

                // 2. Update status of this release to active, others to archived (optional logic)
                await pool.query('UPDATE releases SET status = $1 WHERE id = $2', ['active', id]);

                // 3. Update mfe_registry to reflect these versions
                if (artifacts.mfes && Array.isArray(artifacts.mfes)) {
                    for (const mfe of artifacts.mfes) {
                        // Upsert or Update
                        await pool.query(`
                            INSERT INTO mfe_registry (name, source, version, active, updated_at)
                            VALUES ($1, $2, $3, true, NOW())
                            ON CONFLICT (name) 
                            DO UPDATE SET source = EXCLUDED.source, version = EXCLUDED.version, active = true, updated_at = NOW()
                        `, [mfe.name, mfe.source, mfe.version]);
                    }
                }

                return {
                    status: 200,
                    body: { message: `Release ${release.version} deployed successfully`, release },
                    headers: { 'Content-Type': 'application/json' }
                };
            }

            // Default: Create new release
            const { version, description, artifacts, status } = body;

            if (!version || !artifacts) {
                return {
                    status: 400,
                    body: { error: 'Version and artifacts are required' },
                    headers: { 'Content-Type': 'application/json' }
                };
            }

            const query = `
                INSERT INTO releases (version, description, artifacts, status)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `;
            const values = [version, description, JSON.stringify(artifacts), status || 'draft'];
            const result = await pool.query(query, values);

            return {
                status: 201,
                body: { release: result.rows[0] },
                headers: { 'Content-Type': 'application/json' }
            };
        }

        return { status: 405, body: { error: 'Method not allowed' } };

    } catch (error) {
        console.error('Database error:', error);
        return {
            status: 500,
            body: { error: 'Internal server error: ' + error.message },
            headers: { 'Content-Type': 'application/json' }
        };
    }
};
