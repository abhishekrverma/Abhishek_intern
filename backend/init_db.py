import mysql.connector
import bcrypt
import os
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(dotenv_path=os.path.join(BASE_DIR, '.env'))

# MySQL Configuration from .env
MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
MYSQL_USER = os.getenv('MYSQL_USER', 'root')
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD')   # No hardcoded fallback
MYSQL_DATABASE = os.getenv('MYSQL_DATABASE', 'eduguard')


def init_database():
    print("📦 Initializing MySQL Database...")

    # 1. Connect WITHOUT a database to create it
    conn = mysql.connector.connect(
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD
    )
    cursor = conn.cursor()
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{MYSQL_DATABASE}`")
    conn.close()
    print(f"✅ Database '{MYSQL_DATABASE}' ensured.")

    # 2. Connect to the database
    conn = mysql.connector.connect(
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DATABASE
    )
    cursor = conn.cursor()

    # 3. Users table for authentication
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) UNIQUE NOT NULL,
            email VARCHAR(200) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role ENUM('admin', 'faculty') NOT NULL DEFAULT 'faculty',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 4. Students table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS students (
            student_id VARCHAR(50) PRIMARY KEY,
            math_score INT,
            reading_score INT,
            writing_score INT,
            feedback_text TEXT,
            guardian_email VARCHAR(200),
            gpa FLOAT DEFAULT 0.0,
            attendance_rate INT DEFAULT 100,
            participation_score INT DEFAULT 100,
            late_submissions INT DEFAULT 0,
            assignment_text TEXT,
            ai_essay_score INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 5. Seed default admin user (only if no users exist)
    cursor.execute("SELECT COUNT(*) FROM users")
    user_count = cursor.fetchone()[0]

    if user_count == 0:
        admin_hash = bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        faculty_hash = bcrypt.hashpw("faculty123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        cursor.execute(
            "INSERT INTO users (username, email, password_hash, role) VALUES (%s, %s, %s, %s)",
            ("admin", "admin@eduguard.com", admin_hash, "admin")
        )
        cursor.execute(
            "INSERT INTO users (username, email, password_hash, role) VALUES (%s, %s, %s, %s)",
            ("faculty", "faculty@eduguard.com", faculty_hash, "faculty")
        )
        print("👤 Seeded default users: admin/admin123, faculty/faculty123")
    else:
        print(f"👤 {user_count} users already exist, skipping seed.")

    conn.commit()
    conn.close()

    print(f"✅ Success! MySQL database '{MYSQL_DATABASE}' initialized and ready.")


if __name__ == "__main__":
    init_database()