//PGAdmin Config
const Pool = require("pg").Pool;

const pool = new Pool ({
    user: "postgres",
    password: "panera",
    host: "localhost",
    port: 5432,
    database: "foodcourtinventory"
});

module.exports = pool;