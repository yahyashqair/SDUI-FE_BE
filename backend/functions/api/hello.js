/**
 * Hello World Function
 * Simple test function to verify Fission is working
 * 
 * HTTP Trigger: GET /api/hello
 */

module.exports = async function (context) {
    const name = context.request.query.name || 'World';

    return {
        status: 200,
        body: {
            message: `Hello, ${name}!`,
            timestamp: new Date().toISOString(),
            fission: true,
            environment: {
                nodeVersion: process.version,
                platform: process.platform
            }
        },
        headers: { 'Content-Type': 'application/json' }
    };
};
