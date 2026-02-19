-- Migration: Add 'role' column to 'users' table
ALTER TABLE users ADD COLUMN role VARCHAR(32) NOT NULL DEFAULT 'user';
-- Optionally, update existing users to 'user' role
UPDATE users SET role = 'user' WHERE role IS NULL;