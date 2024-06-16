require('dotenv').config();
const mysql = require('mysql2/promise');

var config = {
    user: process.env.MYSQL_UID,
    password: process.env.MYSQL_PWD,
    host: process.env.MYSQL_SERVER,
    database: process.env.MYSQL_DB,
    port: process.env.MYSQL_PORT
};

const dbPool = mysql.createPool(config);

module.exports = { dbPool }