-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) CHECK (role IN ('principal', 'teacher')) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content table
CREATE TABLE IF NOT EXISTS content (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject VARCHAR(100) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by INTEGER NOT NULL,
  status VARCHAR(20) CHECK (status IN ('uploaded', 'pending', 'approved', 'rejected')) NOT NULL DEFAULT 'uploaded',
  rejection_reason TEXT,
  approved_by INTEGER,
  approved_at TIMESTAMP,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Content_Slots table
CREATE TABLE IF NOT EXISTS content_slots (
  id SERIAL PRIMARY KEY,
  subject VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content_Schedule table
CREATE TABLE IF NOT EXISTS content_schedule (
  id SERIAL PRIMARY KEY,
  content_id INTEGER NOT NULL,
  slot_id INTEGER NOT NULL,
  rotation_order INTEGER NOT NULL,
  duration INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE,
  FOREIGN KEY (slot_id) REFERENCES content_slots(id) ON DELETE CASCADE
);