const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  // Connect to database
  const connConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Rayleigh',
    multipleStatements: true
  };

  // Only use SSL if explicitly enabled (e.g. Aiven needs it, Railway does NOT)
  if (process.env.DB_SSL === 'true') {
    connConfig.ssl = { rejectUnauthorized: false };
    console.log('🔒 Using SSL for database connection');
  }

  const connection = await mysql.createConnection(connConfig);

  try {
    const dbName = process.env.DB_NAME || 'smart_study_buddy';

    // Try to create database (will fail silently on cloud providers that don't allow it)
    try {
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    } catch (e) {
      // Cloud databases often don't allow CREATE DATABASE — that's fine
    }
    await connection.query(`USE \`${dbName}\``);

    // Read and execute base schema
    const schemaPath = path.join(__dirname, '..', 'models', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await connection.query(schema);
    console.log('✅ Base schema tables created');

    // Run ALTER TABLE statements individually (safe to re-run)
    const alterStatements = [
      'ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE',
      'ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMP NULL',
      'ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP NULL',
      'ALTER TABLE users ADD COLUMN login_count INT DEFAULT 0'
    ];

    for (const sql of alterStatements) {
      try {
        await connection.query(sql);
      } catch (err) {
        if (err.errno !== 1060) throw err;
      }
    }
    console.log('✅ User columns verified');

    // --- Notifications table ---
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        type VARCHAR(50) DEFAULT 'default',
        title VARCHAR(255) NOT NULL,
        message TEXT,
        icon VARCHAR(10) DEFAULT '🔔',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_read (user_id, is_read)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Notifications table ready');

    // --- Saved images table ---
    await connection.query(`
      CREATE TABLE IF NOT EXISTS saved_images (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        image_url VARCHAR(1000) NOT NULL,
        prompt TEXT NOT NULL,
        style VARCHAR(50) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_image (user_id, image_url(255))
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Saved images table ready');

    // --- Saved YouTube videos table ---
    await connection.query(`
      CREATE TABLE IF NOT EXISTS saved_youtube_videos (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        video_id VARCHAR(20) NOT NULL,
        title VARCHAR(500) NOT NULL,
        channel_title VARCHAR(255),
        thumbnail VARCHAR(1000),
        subject VARCHAR(100) DEFAULT 'General',
        topic VARCHAR(200) DEFAULT '',
        language VARCHAR(10) DEFAULT 'en',
        url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_video (user_id, video_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Saved YouTube videos table ready');

    console.log(`\n🎉 Database setup completed! (${dbName})`);
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
  } finally {
    await connection.end();
  }
}

setupDatabase();