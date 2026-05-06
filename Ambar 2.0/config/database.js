// config/database.js
const sql = require("mssql");

const dbConfig = {
    user: "emmanuel",
    password: "emmanuel3131",
    server: "localhost",
    database: "ambar",
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

let pool;

async function getPool() {
    if (!pool) {
        pool = await sql.connect(dbConfig);
        console.log("✅ Conectado a SQL Server - BD: ambar");
    }
    return pool;
}

module.exports = { getPool, sql };