import sqlite3
import os

# Configuration
DB_FILE = 'student_system.db'

def init_database():
    print("📦 Initializing Database...")
    
    # Connect to SQLite (Creates file if missing)
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # 1. Users table for authentication
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            password TEXT,
            role TEXT
        )
    ''')
    
    # 2. Students table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS students (
            student_id TEXT PRIMARY KEY,
            math_score INTEGER,
            reading_score INTEGER,
            writing_score INTEGER,
            feedback_text TEXT,
            guardian_email TEXT,
            gpa REAL DEFAULT 0.0,
            attendance_rate INTEGER DEFAULT 100,
            participation_score INTEGER DEFAULT 100,
            late_submissions INTEGER DEFAULT 0,
            assignment_text TEXT DEFAULT '',
            ai_essay_score INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Clear existing data to ensure it's empty
    cursor.execute('DELETE FROM students')
    cursor.execute('DELETE FROM users')
    
    # Seed default users
    cursor.execute("INSERT INTO users (username, password, role) VALUES ('admin', 'admin123', 'admin')")
    cursor.execute("INSERT INTO users (username, password, role) VALUES ('faculty', 'faculty123', 'faculty')")
    
    conn.commit()
    conn.close()
    
    print(f"✅ Success! Database '{DB_FILE}' initialized and ready (Empty state).")

if __name__ == "__main__":
    init_database()