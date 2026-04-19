import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
MYSQL_USER = os.getenv('MYSQL_USER', 'root')
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', 'abhishek11')
MYSQL_DATABASE = os.getenv('MYSQL_DATABASE', 'eduguard')


def register_new_student():
    print("🎓 --- STUDENT REGISTRATION SIMULATION ---")
    print("Enter the details of a NEW student to add to the database.")

    s_id = input("Enter Student ID (e.g., STU_LIVE_01): ")
    math = int(input("Math Score (0-100): "))
    reading = int(input("Reading Score (0-100): "))
    writing = int(input("Writing Score (0-100): "))
    feedback = input("Paste Student Feedback/Email: ")
    email = input("Guardian Email (e.g., parent@gmail.com): ")

    try:
        conn = mysql.connector.connect(
            host=MYSQL_HOST,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            database=MYSQL_DATABASE
        )
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO students 
            (student_id, math_score, reading_score, writing_score, feedback_text, guardian_email)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
            math_score=%s, reading_score=%s, writing_score=%s, feedback_text=%s, guardian_email=%s
        ''', (s_id, math, reading, writing, feedback, email,
              math, reading, writing, feedback, email))

        conn.commit()
        print(f"\n✅ SUCCESS: Student {s_id} saved to MySQL Database.")
        print("Go to your Dashboard now to see the AI Analysis for this student.")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        conn.close()


if __name__ == "__main__":
    register_new_student()