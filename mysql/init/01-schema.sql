-- ============================================
-- Database Initialization Script
-- ============================================

-- Create application user (not root)
CREATE USER IF NOT EXISTS 'studybuddy'@'%' IDENTIFIED BY 'StudyBuddy@2024Dev';
CREATE USER IF NOT EXISTS 'studybuddy_prod'@'%' IDENTIFIED BY 'CHANGE_THIS_Strong_Password_2024!';

-- Create databases
CREATE DATABASE IF NOT EXISTS smart_study_buddy 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS smart_study_buddy_prod 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

-- Grant privileges
GRANT ALL PRIVILEGES ON smart_study_buddy.* TO 'studybuddy'@'%';
GRANT ALL PRIVILEGES ON smart_study_buddy_prod.* TO 'studybuddy_prod'@'%';
FLUSH PRIVILEGES;

-- Use the database
USE smart_study_buddy;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    avatar VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) DEFAULT '📚',
    is_default BOOLEAN DEFAULT FALSE,
    user_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_default (is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chat sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    subject_id INT DEFAULT NULL,
    subject_name VARCHAR(100) DEFAULT 'General',
    mode VARCHAR(50) DEFAULT 'normal',
    title VARCHAR(255) DEFAULT 'New Chat',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_updated (updated_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_id INT NOT NULL,
    role ENUM('user', 'assistant', 'system') NOT NULL,
    content TEXT NOT NULL,
    content_type ENUM('text', 'code', 'image', 'video', 'audio') DEFAULT 'text',
    tokens_used INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Study statistics
CREATE TABLE IF NOT EXISTS study_stats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    subject_name VARCHAR(100) NOT NULL,
    time_spent_seconds INT DEFAULT 0,
    questions_asked INT DEFAULT 0,
    session_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_subject_date (user_id, subject_name, session_date),
    INDEX idx_user_date (user_id, session_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Generated media
CREATE TABLE IF NOT EXISTS generated_media (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    media_type ENUM('image', 'video', 'audio') NOT NULL,
    prompt TEXT NOT NULL,
    url VARCHAR(1000) DEFAULT NULL,
    file_path VARCHAR(500) DEFAULT NULL,
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    theme ENUM('light', 'dark') DEFAULT 'dark',
    preferred_mode VARCHAR(50) DEFAULT 'normal',
    tts_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default subjects
INSERT INTO subjects (name, icon, is_default) VALUES
    ('DBMS', '🗄️', TRUE),
    ('C Programming', '©️', TRUE),
    ('Java', '☕', TRUE),
    ('Python', '🐍', TRUE),
    ('Data Structures', '🌳', TRUE),
    ('Algorithms', '⚙️', TRUE),
    ('Operating Systems', '💻', TRUE),
    ('Computer Networks', '🌐', TRUE),
    ('Aptitude', '🧮', TRUE),
    ('System Design', '🏗️', TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Insert admin user (password: Admin@123)
-- Hash generated with bcrypt rounds=12
INSERT INTO users (username, email, password, role) VALUES
    ('admin', 'admin@studybuddy.com', 
     '$2a$12$LJ3m4ys3Lg8Hy6ckN0YBwOQKHJk5LZ2zPxZjQ3vQx/LzXe5k4q5S6', 
     'admin')
ON DUPLICATE KEY UPDATE username = VALUES(username);