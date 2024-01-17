import mysql from "mysql2/promise";

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: 3306,
});
// const pool = mysql.createPool({
//   host: "127.0.0.1",
//   user: "root",
//   password: "Ky9W<pU,8lDn",
//   database: "tomsms_db",
//   port: 3306,
// });
console.log(process.env.DB_HOST);
export default pool;
