import mysql.connector
import bcrypt
import os
import re
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(dotenv_path=os.path.join(BASE_DIR, '.env'))

# ── Connection config ────────────────────────────────────────────────────────
# Supports DATABASE_URL (Railway/Aiven) OR individual MYSQL_* env vars
_DATABASE_URL = os.getenv('DATABASE_URL') or os.getenv('MYSQL_URL')

if _DATABASE_URL:
    m = re.match(r'(?:jdbc:)?mysql://([^:]+):([^@]+)@([^:/]+):?(\d+)?/([^?]+)', _DATABASE_URL)
    if not m:
        raise ValueError(f"Cannot parse DATABASE_URL: {_DATABASE_URL}")
    CONNECT_ARGS = {
        'user':     m.group(1),
        'password': m.group(2),
        'host':     m.group(3),
        'port':     int(m.group(4)) if m.group(4) else 3306,
        'database': m.group(5),
    }
    DB_NAME = m.group(5)
    print(f"🔗 Using DATABASE_URL → {m.group(3)}:{CONNECT_ARGS['port']}/{DB_NAME}")
else:
    CONNECT_ARGS = {
        'host':     os.getenv('MYSQL_HOST', 'localhost'),
        'port':     int(os.getenv('MYSQL_PORT', '3306')),
        'user':     os.getenv('MYSQL_USER', 'root'),
        'password': os.getenv('MYSQL_PASSWORD'),
        'database': os.getenv('MYSQL_DATABASE', 'eduguard'),
    }
    DB_NAME = CONNECT_ARGS['database']
    print(f"🔗 Using env vars → {CONNECT_ARGS['host']}:{CONNECT_ARGS['port']}/{DB_NAME}")


def init_database():
    print("📦 Initializing MySQL Database...")

    # When using DATABASE_URL the DB already exists (Railway provisions it)
    # so connect directly; only try CREATE DATABASE for local setups
    if not (_DATABASE_URL):
        bare = {k: v for k, v in CONNECT_ARGS.items() if k != 'database'}
        conn = mysql.connector.connect(**bare)
        conn.cursor().execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}`")
        conn.close()
        print(f"✅ Database '{DB_NAME}' ensured.")

    # Connect to the target database
    conn = mysql.connector.connect(**CONNECT_ARGS)
    cursor = conn.cursor()

    # Users table
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

    # Students table
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

    # Seed default users only if none exist
    cursor.execute("SELECT COUNT(*) FROM users")
    user_count = cursor.fetchone()[0]

    if user_count == 0:
        admin_hash   = bcrypt.hashpw(b"admin123",   bcrypt.gensalt()).decode()
        faculty_hash = bcrypt.hashpw(b"faculty123", bcrypt.gensalt()).decode()

        cursor.execute(
            "INSERT INTO users (username, email, password_hash, role) VALUES (%s, %s, %s, %s)",
            ("admin", "admin@eduguard.com", admin_hash, "admin")
        )
        cursor.execute(
            "INSERT INTO users (username, email, password_hash, role) VALUES (%s, %s, %s, %s)",
            ("faculty", "faculty@eduguard.com", faculty_hash, "faculty")
        )
        print("👤 Seeded: admin/admin123  |  faculty/faculty123")
    else:
        print(f"👤 {user_count} user(s) already exist — skipping seed.")

    conn.commit()
    conn.close()
    print(f"✅ Done! Database '{DB_NAME}' is initialized and ready.")


if __name__ == "__main__":
    init_database()