/**
 * Seed script to insert a Warden account into the Supercampus MySQL database.
 * Run with: node scripts/seed-warden.js
 */
const mysql = require("mysql2/promise");
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 32);
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

async function main() {
  const config = {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306", 10),
    user: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || "root@123",
    database: process.env.DB_DATABASE || "supercampus",
  };

  const conn = await mysql.createConnection(config);

  const email = "warden@nmit.ac.in";
  const password = "campus2026";
  const usn = "WRD-001";
  const fullName = "Hostel Chief Warden";
  const tenantId = "nmit";

  console.log(`Connecting to database ${config.database}...`);

  // Check if already exists
  const [existing] = await conn.query(
    "SELECT * FROM campus_directory WHERE collegeEmail = ? OR usn = ?",
    [email, usn]
  );

  if (existing.length > 0) {
    console.log(`Warden account already exists with email: ${email}`);
    console.log(`Login credentials:`);
    console.log(`  Email:    ${email}`);
    console.log(`  Password: ${password}`);
    await conn.end();
    return;
  }

  const dirId = crypto.randomUUID();
  const userId = crypto.randomUUID();
  const globalId = crypto.randomUUID();
  const passHash = await hashPassword(password);

  // 1. Insert into campus_directory
  await conn.query(
    `INSERT INTO campus_directory 
      (id, usn, fullName, collegeEmail, personalEmail, mobile, role, isHostelite, department, batch, program, status, userId, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(6), NOW(6))`,
    [
      dirId,
      usn,
      fullName,
      email,
      "warden.personal@gmail.com",
      "+919876543210",
      "WARDEN",
      0,
      "Hostel Affairs",
      null,
      null,
      "active",
      userId,
    ]
  );

  // 2. Insert into user account
  await conn.query(
    `INSERT INTO user
      (id, directoryId, loginId, passwordHash, status, theme, changePasswordRequired, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW(6), NOW(6))`,
    [userId, dirId, email, passHash, "active", "dark", 0]
  );

  // 3. Insert into global_login
  await conn.query(
    `INSERT INTO global_login
      (id, loginId, tenantId, directoryId)
     VALUES (?, ?, ?, ?)`,
    [globalId, email, tenantId, dirId]
  );

  console.log("Successfully created Warden account!");
  console.log("-----------------------------------------");
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log(`  Role:     WARDEN`);
  console.log(`  USN/Code: ${usn}`);
  console.log(`  Name:     ${fullName}`);
  console.log("-----------------------------------------");

  await conn.end();
}

main().catch((err) => {
  console.error("Failed to seed warden:", err);
  process.exit(1);
});
