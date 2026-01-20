
const Database = require('better-sqlite3');
const path = require('path');

// Connect to the tenant DB which is 2 levels up from src/lib
// src/lib/db.js -> src/lib -> src -> projectDir -> projectDir.db (no, it's ../../<id>.db relative to src)
// Actually structure is data/tenants/<id>/src/lib/db.js
// DB is at data/tenants/<id>.db
// So it is ../../../<id>.db
const dbPath = path.resolve(__dirname, '../../../test-security-proj.db');
const db = new Database(dbPath);

module.exports = {
    query: (sql, ...args) => {
        const stmt = db.prepare(sql);
        if (sql.trim().toLowerCase().startsWith('select')) {
            return stmt.all(...args);
        } else {
            return stmt.run(...args);
        }
    }
};
    