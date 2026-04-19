import mysql.connector
import bcrypt
import os
from dotenv import load_dotenv

load_dotenv()

MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
MYSQL_USER = os.getenv('MYSQL_USER', 'root')
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', 'abhishek11')
MYSQL_DATABASE = os.getenv('MYSQL_DATABASE', 'eduguard')


def reset_db():
    print(f"🧹 Resetting MySQL database '{MYSQL_DATABASE}'...")

    conn = mysql.connector.connect(
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DATABASE
    )
    cursor = conn.cursor()

    # Clear all student data
    cursor.execute("DELETE FROM students")
    print("   - All student records deleted.")

    # Clear all users and re-seed defaults
    cursor.execute("DELETE FROM users")
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
    print("   - Users reset to defaults (admin/admin123, faculty/faculty123).")

    conn.commit()
    conn.close()

    print("\n✅ SUCCESS: Database is now RESET.")
    print("   - The AI Model is still trained and ready.")
    print("   - The Dashboard will show 0 students until you register one.")


if __name__ == "__main__":
    reset_db()