const { dbPool } = require("../config/initmysql");

/**
 * 
 * @param {String} table 
 * @returns {Promise<import("mysql2").FieldPacket[]>}
 */
const readTableMysql = async (table) => {
    /**
     * @type {[Array.<{TABLE_NAME: string}>, import("mysql2").FieldPacket]}
     */
    const [resp, fields] = await dbPool.query(`SELECT * FROM ${table} LIMIT 1`);
    return fields;
}

/**
 * 
 * @returns {Promise<String[]>}
 */
const readAllTablesMysql = async () => {
    /**
     * @type {[Array.<{TABLE_NAME: string}>]}
     */
    const [resp] = await dbPool.query(`SELECT TABLE_NAME FROM information_schema.tables WHERE table_schema = '${process.env.MYSQL_DB}'`);
    if (resp.length == 0) { console.log("DB has no tables!"); process.exit(); }
    const tables = [];
    for (let i = 0; i < resp.length; i++) {
        tables.push(resp[i].TABLE_NAME)
    }
    return tables;
}

module.exports = { readAllTablesMysql, readTableMysql }