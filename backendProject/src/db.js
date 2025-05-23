// db.js
const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "76.141.132.172",
  database: "library_db",
  password: "zxcvbnm1",
  port: 5432,
});

//export default pool;
module.exports = pool;
