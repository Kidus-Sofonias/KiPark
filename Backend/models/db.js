require("dotenv").config();
const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

(async () => {
  try {
    // Create users table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        area VARCHAR(100) NOT NULL,
        available_spaces INT DEFAULT 50
      );
    `);

    // Create parking_records table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS parking_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        license_plate VARCHAR(20) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        entry_time DATETIME NOT NULL,
        exit_time DATETIME,
        pin VARCHAR(10),
        cost DECIMAL(10,2),
        status ENUM('parked', 'exited') NOT NULL,
        parker_id INT NOT NULL,
        FOREIGN KEY (parker_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    console.log("✅ Database tables ensured.");
  } catch (error) {
    console.error("❌ Error ensuring tables:", error.message);
  }
})();

module.exports = db;
