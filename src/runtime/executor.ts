import { getTenantDB } from '../db/tenant';
import vm from 'vm';

export const executeFunction = async (projectId: string, code: string, params: any) => {
  const db = getTenantDB(projectId);

  // Create a secure context
  const context = {
    db: {
      query: (sql: string, ...args: any[]) => {
        const stmt = db.prepare(sql);
        if (sql.trim().toLowerCase().startsWith('select')) {
          return stmt.all(...args);
        } else {
          return stmt.run(...args);
        }
      }
    },
    params,
    console: {
      log: (...args: any[]) => console.log(`[App ${projectId}]`, ...args),
      error: (...args: any[]) => console.error(`[App ${projectId}]`, ...args)
    },
    // Add other safe utilities here
    JSON,
    Date,
    Math
  };

  vm.createContext(context);

  // Wrap code in an async function to allow await if we supported async/await in pure JS,
  // but better-sqlite3 is synchronous, which simplifies things immensely for this demo.
  // We'll wrap it in a function invocation.
  const script = new vm.Script(`
    (function() {
      try {
        ${code}
      } catch (e) {
        return { error: e.message };
      }
    })()
  `);

  try {
    const result = script.runInContext(context);
    return result;
  } catch (e: any) {
    return { error: e.message };
  }
};
