// db.js
const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "library_db",
  password: "zxcvbnm1",
  port: 5432,
});

//export default pool;
module.exports = pool;