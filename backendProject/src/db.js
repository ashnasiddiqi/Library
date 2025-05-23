// db.js
const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "10.0.0.28",
  database: "library_db",
  password: "zxcvbnm1",
  port: 5432,
});

//export default pool;
module.exports = pool;
