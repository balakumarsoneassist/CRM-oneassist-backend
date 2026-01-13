const { Pool } = require('pg');

const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingVars = requiredEnvVars.filter(key => !process.env[key]);

if (missingVars.length > 0) {
    console.error(`❌ CRITICAL ERROR: Missing required database environment variables: ${missingVars.join(', ')}`);
    console.error('Please check your .env file or server environment configuration.');
    process.exit(1);
}

// Explicitly ensure password is treated as a string to avoid SASL error
if (typeof process.env.DB_PASSWORD !== 'string') {
    console.error('❌ CRITICAL ERROR: DB_PASSWORD must be a string.');
    process.exit(1);
}

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

pool.connect((err, client, release) => {
    if (err) {
        console.error('Error acquiring client', err.stack);
    } else {
        console.log('Database connected');
        release();
    }
});

module.exports = pool;
