const { dbPool } = require('./config/initmysql');
const templates = require('./utils/templates');

const readTableMysql = async (table = '') => {
    const [resp, fields] = await dbPool.query(`SELECT * FROM ${table} LIMIT 1`);
    return fields;
}

const readArgs = () => {
    const validArgs = ['table', '-mysql', '-mssql', '-withMiddleware'];
    const args = { table: '', mysql: false, mssql: false, withmiddleware: false };
    const read = process.argv;
    for (let i = 2; i < read.length; i++) {
        if (validArgs.indexOf(read[i]) == -1) {
            if (read[i] != '') {
                console.log(`Invalid argument ${read[i]}`);
                process.exit();
            }
        } else {
            if (read[i][0] == '-') {
                args[read[i].slice(1).toLowerCase()] = true;
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
    
    templates.generate(args.table, fields, args.withmiddleware)
    process.exit();
}

generateCrud()