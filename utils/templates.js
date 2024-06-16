const requiredImports = () => {
    return `require("dotenv").config();
    const { response } = require('../utility/response');
    const { dbPool } = require("../config/initmysql");
    const joi = require('joi');
    const { prepareResponse } = require("../utility/prepare");`

}

const read = (joi = false) => {
    const template = `
    

    `
}