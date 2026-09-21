require('dotenv').config();

const pool = require('./db');

async function migrate() {
  try {
    console.log('Starting database migration...');

    // 1. Users
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(20),

        -- Email verification
        is_email_verified TINYINT(1) NOT NULL DEFAULT 0,
        email_otp VARCHAR(6) NULL,
        email_otp_expiry DATETIME NULL,

        -- Phone verification
        is_phone_verified TINYINT(1) NOT NULL DEFAULT 0,
        phone_otp VARCHAR(6) NULL,
        phone_otp_expiry DATETIME NULL,

        -- Forgot password
        reset_otp VARCHAR(6) NULL,
        reset_otp_expiry DATETIME NULL,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Users table created/checked.');

    // 1.1 Make sure OTP columns exist in an already-existing users table
    // This is important because CREATE TABLE IF NOT EXISTS does not
    // modify an existing table.

    const [userColumns] = await pool.query(`
      SHOW COLUMNS FROM users
    `);

    const existingColumns = userColumns.map((column) => column.Field);

    if (!existingColumns.includes('is_email_verified')) {
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN is_email_verified TINYINT(1) NOT NULL DEFAULT 0
      `);
      console.log('Added is_email_verified.');
    }

    if (!existingColumns.includes('is_phone_verified')) {
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN is_phone_verified TINYINT(1) NOT NULL DEFAULT 0
      `);
      console.log('Added is_phone_verified.');
    }

    if (!existingColumns.includes('email_otp')) {
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN email_otp VARCHAR(6) NULL
      `);
      console.log('Added email_otp.');
    }

    if (!existingColumns.includes('email_otp_expiry')) {
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN email_otp_expiry DATETIME NULL
      `);
      console.log('Added email_otp_expiry.');
    }

    if (!existingColumns.includes('phone_otp')) {
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN phone_otp VARCHAR(6) NULL
      `);
      console.log('Added phone_otp.');
    }

    if (!existingColumns.includes('phone_otp_expiry')) {
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN phone_otp_expiry DATETIME NULL
      `);
      console.log('Added phone_otp_expiry.');
    }

    if (!existingColumns.includes('reset_otp')) {
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN reset_otp VARCHAR(6) NULL
      `);
      console.log('Added reset_otp.');
    }

    if (!existingColumns.includes('reset_otp_expiry')) {
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN reset_otp_expiry DATETIME NULL
      `);
      console.log('Added reset_otp_expiry.');
    }

    console.log('OTP and password-reset columns checked.');

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