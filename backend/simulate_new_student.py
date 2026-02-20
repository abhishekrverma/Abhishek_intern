import sqlite3

DB_FILE = 'student_system.db'

def register_new_student():
    print("🎓 --- STUDENT REGISTRATION SIMULATION ---")
    print("Enter the details of a NEW student to add to the database.")
    
    # 1. Take User Input (Simulating a real form submission)
    s_id = input("Enter Student ID (e.g., STU_LIVE_01): ")
    math = int(input("Math Score (0-100): "))
    reading = int(input("Reading Score (0-100): "))
    writing = int(input("Writing Score (0-100): "))
    feedback = input("Paste Student Feedback/Email: ")
    email = input("Guardian Email (e.g., parent@gmail.com): ")
    
    # 2. Insert into Database
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO students 
            (student_id, math_score, reading_score, writing_score, feedback_text, guardian_email)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (s_id, math, reading, writing, feedback, email))
        
        conn.commit()
        print(f"\n✅ SUCCESS: Student {s_id} saved to Backend Database.")
        print("Go to your Dashboard now to see the AI Analysis for this student.")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    register_new_student()