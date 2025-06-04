// db.js
const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "database-2.cn0geogwil7k.us-east-2.rds.amazonaws.com",
  database: "library_db",
  password: "MliGSEbLpRtIY4IWBSyC",
  port: 5432,
  ssl: {
    rejectUnauthorized: false, // For development only. 
  },
});

//export default pool;
module.exports = pool;
