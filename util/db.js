const mysql = require("mysql2");

const pool = mysql.createPool({
    host: "localhost",
    user: "mhmod",
    password: "12",
    database: "node-complete",
});

module.exports = pool.promise();
