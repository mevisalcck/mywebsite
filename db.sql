-- Create the main database
CREATE DATABASE IF NOT EXISTS my_app_db;
USE my_app_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Plans table
CREATE TABLE IF NOT EXISTS plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  plan_id INT NOT NULL,
  start_date DATE,
  end_date DATE,
  status ENUM('active', 'inactive', 'cancelled') DEFAULT 'active',
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (plan_id) REFERENCES plans(id)
);

-- Uploads table (optional)
CREATE TABLE IF NOT EXISTS uploads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  filename VARCHAR(255),
  path TEXT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert dummy users
INSERT INTO users (username, email, password, role) VALUES
('admin', 'admin@example.com', '$2b$10$DUMMYHASH1', 'admin'),
('user1', 'user1@example.com', '$2b$10$DUMMYHASH2', 'user');

-- Insert dummy plans
INSERT INTO plans (name, description, price) VALUES
('Free Plan', 'Access to limited features.', 0.00),
('Pro Plan', 'Full access with more features.', 9.99),
('Enterprise', 'Custom plan for large teams.', 49.99);

-- Insert sample subscriptions
INSERT INTO subscriptions (user_id, plan_id, start_date, end_date, status) VALUES
(1, 2, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'active'),
(2, 1, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'active');
