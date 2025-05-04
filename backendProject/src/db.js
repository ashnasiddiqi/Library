// db.js
const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "library_db",
  password: "Wkuw2019",
  port: 5432,
});

module.exports = pool;
