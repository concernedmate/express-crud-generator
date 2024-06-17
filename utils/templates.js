const fs = require('fs');
const path = require('path');

// taken from field_flags.js in mysql2
const mysql2_flags = {
    NOT_NULL: 1,
    PRI_KEY: 2,
    UNIQUE_KEY: 4,
    MULTIPLE_KEY: 8,
    BLOB: 16,
    UNSIGNED: 32,
    ZEROFILL: 64,
    BINARY: 128,
    ENUM: 256,
    AUTO_INCREMENT: 512,
    TIMESTAMP: 1024,
    SET: 2048,
    NO_DEFAULT_VALUE: 4096,
    ON_UPDATE_NOW: 8192,
    NUM: 32768
}

// from mysql2 source
const mysql2_types = {
    DECIMAL: 0,
    TINY: 1,
    SHORT: 2,
    LONG: 3,
    FLOAT: 4,
    DOUBLE: 5,
    NULL: 6,
    TIMESTAMP: 7,
    LONGLONG: 8,
    INT24: 9,
    DATE: 10,
    TIME: 11,
    DATETIME: 12,
    YEAR: 13,
    NEWDATE: 14,
    VARCHAR: 15,
    BIT: 16,
    JSON: 245,
    NEWDECIMAL: 246,
    ENUM: 247,
    SET: 248,
    TINY_BLOB: 249,
    MEDIUM_BLOB: 250,
    LONG_BLOB: 251,
    BLOB: 252,
    VAR_STRING: 253,
    STRING: 254,
    GEOMETRY: 255
}

const dbConn = `
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
`

const generate = (table, fields) => {
    try {
        if (table == null || fields == null) return false;

        // GENERATE DB CONN
        const db_conn_path = path.join(__dirname, '../generated/config/');
        if (!fs.existsSync(db_conn_path)) { fs.mkdirSync(db_conn_path); }
        const db_conn_file_path = path.join(db_conn_path, `initmysql.js`);
        if (fs.existsSync(db_conn_file_path)) {
            fs.unlinkSync(db_conn_file_path);
        }
        fs.writeFileSync(db_conn_file_path, dbConn);
        console.log(`Generated ${db_conn_file_path}`);

        // GENERATE CONTROLLERS
        const controller_path = path.join(__dirname, '../generated/controllers/');
        if (!fs.existsSync(controller_path)) { fs.mkdirSync(controller_path); }
        const file_path = path.join(controller_path, `${table}.js`);
        if (fs.existsSync(file_path)) {
            fs.unlinkSync(file_path);
        } else {
            fs.writeFileSync(file_path, '')
        }

        let exports = []

        // imports
        fs.appendFileSync(file_path, requiredImports());

        // read
        fs.appendFileSync(file_path, read(table));
        exports.push(`get${table[0].toUpperCase()}${table.slice(1)}`);

        // create
        fs.appendFileSync(file_path, create(table, fields));
        exports.push(`create${table[0].toUpperCase()}${table.slice(1)}`);

        // module exports
        fs.appendFileSync(file_path, `\nmodule.exports = {${exports.toString()}}`);
        console.log(`Generated ${file_path}`);

        // GENERATE ROUTERS
        const router_path = path.join(__dirname, '../generated/routes/');
        if (!fs.existsSync(router_path)) { fs.mkdirSync(router_path); }

        const router_file_path = path.join(router_path, `${table}.js`);
        if (fs.existsSync(router_file_path)) {
            fs.unlinkSync(router_file_path);
        } else {
            fs.writeFileSync(router_file_path, '')
        }
        fs.appendFileSync(router_file_path, routes(table, exports));
        console.log(`Generated ${router_file_path}`)
    } catch (error) {
        console.log(error);
        return false;
    }
}

const requiredImports = () => {
    return `
    require("dotenv").config();
    const { response } = require('../utility/response');
    const { dbPool } = require("../config/initmysql");
    const joi = require('joi');
    const { prepareResponse } = require("../utility/prepare");
    `
}

const create = (table, fields) => {
    let field_checker = ``
    let field_vars = ``
    let required_val = []
    let not_required_val = []

    for (let i = 0; i < fields.length; i++) {
        const autoincrement = (fields[i].flags & mysql2_flags.AUTO_INCREMENT) == mysql2_flags.AUTO_INCREMENT; // check autoincrement
        const not_null = (fields[i].flags & mysql2_flags.NOT_NULL) == mysql2_flags.NOT_NULL;
        const no_default = (fields[i].flags & mysql2_flags.NO_DEFAULT_VALUE) == mysql2_flags.NO_DEFAULT_VALUE;
        const is_datetime = (fields[i].type == mysql2_types.DATETIME || fields.type == mysql2_types.TIMESTAMP);
        const is_number = (
            fields[i].type == mysql2_types.TINY ||
            fields[i].type == mysql2_types.SHORT ||
            fields[i].type == mysql2_types.LONG ||
            fields[i].type == mysql2_types.INT24
        )

        if (autoincrement) continue;
        if (is_datetime && !no_default) continue;

        field_checker += `${fields[i].name}: joi${is_number ? '.number()' : '.string()'}${not_null && no_default ? '.required()' : '.optional()'},\n`
        field_vars += `${fields[i].name},`;
        if (not_null && no_default) {
            required_val.push(fields[i].name)
        } else {
            not_required_val.push(fields[i].name)
        }
    }
    field_checker = field_checker.trim();
    field_vars = field_vars.trim();
    field_checker = field_checker.substr(0, field_checker.length - 1);
    field_vars = field_vars.substr(0, field_vars.length - 1);

    const input_checker = `const schema = joi.object({
        ${field_checker}
        });
        const { error } = schema.validate(req.body);
        if (error) return response(res, 500, error.message);

        const {${field_vars}} = req.body;
    `

    let required_val_string = required_val.slice(0);
    required_val_string.forEach((elm, idx) => { required_val_string[idx] = `'\${${elm}}'`; });

    let optional_checker = `
        let col = \`${required_val.toString()},\`
        let val = \`${required_val_string.toString()},\`
    `;
    for (let i = 0; i < not_required_val.length; i++) {
        optional_checker += `if (${not_required_val[i]} != null) {
            col += \`\${${not_required_val[i]}},\`;
            val += \`'\${${not_required_val[i]}}',\`
        }`
    }
    optional_checker += `
        col = col.substr(0, col.length-1);
        val = val.substr(0, val.length-1);
    `

    return `
    const create${table[0].toUpperCase()}${table.slice(1)} = async (req, res) => {
        try {
            ${input_checker} ${optional_checker}
            const query = \`INSERT INTO ${table} (\${col}) VALUES (\${val})\`;
            const [resp] = await dbPool.query(query);
            return response(res, 200, '[Success]', resp);
        } catch (error) {
            return response(res, 500, error.message);
        }
    }
    `
}

const read = (table) => {
    const input_checker = `const schema = joi.object({
                from_row: joi.number().optional(),
                limit: joi.number().optional()
            });
            const { error } = schema.validate(req.query);
            if (error) return response(res, 500, error.message);

            const {from_row, limit} = req.query;

            if (from_row == null) {  from_row = 0;  }
            if (limit == null) { limit = 100; }
    `

    return `
    const get${table[0].toUpperCase()}${table.slice(1)} = async (req, res) => {
        try {
            ${input_checker}
            const query = 'SELECT * FROM ${table} LIMIT' + from_row + ', ' + limit;
            const [resp, fields] = await dbPool.query(query);
            return response(res, 200, '[Success]', prepareResponse(resp, fields));
        } catch (error) {
            return response(res, 500, error.message);
        }
    }
    `
}

const updateByKey = (table, fields) => {

}

const deleteByKey = (table) => {

}

const routes = (table, exported = ['']) => {
    let requires = `const ${table}Controller = require('../controllers/${table}.js');\n`
    let routes = ``;
    for (let i = 0; i < exported.length; i++) {
        let method = 'get';
        let params = '/'
        if (exported[i].includes('create')) {
            method = 'post';
            params = '/add'
        } else if (exported[i].includes('update')) {
            method = 'put';
            params = '/update'
        } else if (exported[i].includes('delete')) {
            method = 'delete';
            params = '/delete'
        }
        routes += `router.${method}('${params}', ${table}Controller.${exported});\n`;
    }
    return `${requires}\n${routes}\nmodule.exports = router;`
}

module.exports = { generate }

