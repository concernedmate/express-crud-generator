require('dotenv').config();
const mssql = require('mssql');

const config = {
    user: process.env.MSSQL_UID,
    password: process.env.MSSQL_PWD,
    server: process.env.MSSQL_SERVER,
    database: process.env.MSSQL_DB,
    port: parseInt(process.env.MSSQL_PORT),
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        encrypt: false, // for azure
        trustServerCertificate: true
    }
}
const dbPool = new mssql.ConnectionPool(config);

dbPool.connect().then(() => {
    console.log('Init db mssql success');
}).catch(function (err) {
    console.log('Error creating connection pool', err);
    process.exit();
});

const dbStartTransaction = (dbPool) => {
    const dbTransact = new mssql.Transaction(dbPool);
    const transactRequest = new mssql.Request(dbTransact);
    return { transactRequest, dbTransact }
}

module.exports = { dbPool, dbStartTransaction }