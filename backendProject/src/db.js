// db.js
const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "database-2.cn0geogwil7k.us-east-2.rds.amazonaws.com",
  database: "library_db",
  password: "zxcvbnm1",
  port: 5432,
});

//export default pool;
module.exports = pool;
