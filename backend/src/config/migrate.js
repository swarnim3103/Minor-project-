require('dotenv').config();

const pool = require('./db');

async function migrate() {
  try {
    console.log('Starting database migration...');

    // 1. Users
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        phone_number VARCHAR(20) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        role VARCHAR(50) NOT NULL DEFAULT 'user',

        is_email_verified TINYINT(1) NOT NULL DEFAULT 0,
        is_phone_verified TINYINT(1) NOT NULL DEFAULT 0,

        email_otp VARCHAR(6) DEFAULT NULL,
        email_otp_expiry DATETIME DEFAULT NULL,

        phone_otp VARCHAR(6) DEFAULT NULL,
        phone_otp_expiry DATETIME DEFAULT NULL,

        reset_otp VARCHAR(6) DEFAULT NULL,
        reset_otp_expiry DATETIME DEFAULT NULL
      )
    `);

    console.log('Users table created/checked.');

    // 1.1 Check OTP columns in case users table already existed
    const [userColumns] = await pool.query(`
      SHOW COLUMNS FROM users
    `);

    const existingColumns = userColumns.map((column) => column.Field);

    const columnsToAdd = [
      {
        name: 'phone_number',
        sql: `
          ALTER TABLE users
          ADD COLUMN phone_number VARCHAR(20) DEFAULT NULL
        `
      },
      {
        name: 'role',
        sql: `
          ALTER TABLE users
          ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'user'
        `
      },
      {
        name: 'is_email_verified',
        sql: `
          ALTER TABLE users
          ADD COLUMN is_email_verified TINYINT(1) NOT NULL DEFAULT 0
        `
      },
      {
        name: 'is_phone_verified',
        sql: `
          ALTER TABLE users
          ADD COLUMN is_phone_verified TINYINT(1) NOT NULL DEFAULT 0
        `
      },
      {
        name: 'email_otp',
        sql: `
          ALTER TABLE users
          ADD COLUMN email_otp VARCHAR(6) DEFAULT NULL
        `
      },
      {
        name: 'email_otp_expiry',
        sql: `
          ALTER TABLE users
          ADD COLUMN email_otp_expiry DATETIME DEFAULT NULL
        `
      },
      {
        name: 'phone_otp',
        sql: `
          ALTER TABLE users
          ADD COLUMN phone_otp VARCHAR(6) DEFAULT NULL
        `
      },
      {
        name: 'phone_otp_expiry',
        sql: `
          ALTER TABLE users
          ADD COLUMN phone_otp_expiry DATETIME DEFAULT NULL
        `
      },
      {
        name: 'reset_otp',
        sql: `
          ALTER TABLE users
          ADD COLUMN reset_otp VARCHAR(6) DEFAULT NULL
        `
      },
      {
        name: 'reset_otp_expiry',
        sql: `
          ALTER TABLE users
          ADD COLUMN reset_otp_expiry DATETIME DEFAULT NULL
        `
      }
    ];

    for (const column of columnsToAdd) {
      if (!existingColumns.includes(column.name)) {
        await pool.query(column.sql);
        console.log(`Added missing column: ${column.name}`);
      }
    }

    console.log('Users OTP/authentication columns checked.');

    // 2. Medicines
    await pool.query(`
      CREATE TABLE IF NOT EXISTS medicines (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(150) NOT NULL,
        dosage VARCHAR(100),
        frequency VARCHAR(100),
        instructions TEXT,
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT fk_medicines_user
          FOREIGN KEY (user_id)
          REFERENCES users(id)
          ON DELETE CASCADE
      )
    `);

    console.log('Medicines table created/checked.');

    // 3. Prescriptions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS prescriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        file_url VARCHAR(500),
        doctor_name VARCHAR(150),
        prescription_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT fk_prescriptions_user
          FOREIGN KEY (user_id)
          REFERENCES users(id)
          ON DELETE CASCADE
      )
    `);

    console.log('Prescriptions table created/checked.');

    // 4. Reminders
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reminders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        medicine_id INT NOT NULL,
        reminder_time TIME NOT NULL,
        start_date DATE,
        end_date DATE,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT fk_reminders_user
          FOREIGN KEY (user_id)
          REFERENCES users(id)
          ON DELETE CASCADE,

        CONSTRAINT fk_reminders_medicine
          FOREIGN KEY (medicine_id)
          REFERENCES medicines(id)
          ON DELETE CASCADE
      )
    `);

    console.log('Reminders table created/checked.');

    // 5. Reminder Logs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reminder_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reminder_id INT NOT NULL,
        attempt_number INT NOT NULL DEFAULT 1,
        status VARCHAR(30) NOT NULL,
        attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        error_message TEXT,

        CONSTRAINT fk_reminder_logs_reminder
          FOREIGN KEY (reminder_id)
          REFERENCES reminders(id)
          ON DELETE CASCADE
      )
    `);

    console.log('Reminder logs table created/checked.');

    console.log('Database migration completed successfully.');

  } catch (error) {
    console.error('Migration failed:', error.message);
  } finally {
    await pool.end();
  }
}

migrate();