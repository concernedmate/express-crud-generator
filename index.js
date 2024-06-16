
const fs = require('fs');
const readline = require('readline');
const { dbPool } = require('./config/initmysql');

const readTableMysql = async (table = '') => {
    const [resp, fields] = await dbPool.query(`SELECT * FROM ${table} LIMIT 1`);
    return fields;
}

const readArgs = () => {
    const validArgs = ['table', '-mysql', '-mssql'];
    const args = { table: '', options: [] };
    const read = process.argv;
    for (let i = 2; i < read.length; i++) {
        if (validArgs.indexOf(read[i]) == -1) {
            if (read[i] != '') {
                console.log(`Invalid argument ${read[i]}`);
                process.exit();
            }
        } else {
            if (read[i][0] == '-') {
                args['options'].push(read[i]);
            } else {
                if (read[i + 1] == undefined) {
                    console.log(`Invalid argument ${read[i]} need input`);
                    process.exit();
                } else {
                    args[read[i]] = read[i + 1];
                    i++;
                }
            }
        }
    }
    return args;
}

const generateCrud = async () => {
    const args = readArgs();
    const fields = await readTableMysql(args.table);
    console.log("hello world");
    process.exit();
}

generateCrud()