import sqlite3
import os

DB_FILE = 'student_system.db'

def reset_db():
    print(f"🧹 Cleaning up '{DB_FILE}'...")
    
    # 1. Delete the old file if it exists
    if os.path.exists(DB_FILE):
        os.remove(DB_FILE)
        print("   - Old database file deleted.")

    # 2. Connect (Creates a fresh file)
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # 3. Create the Empty Table Structure
    print("   - Creating fresh table schema...")
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS students (
            student_id TEXT PRIMARY KEY,
            math_score INTEGER,
            reading_score INTEGER,
            writing_score INTEGER,
            feedback_text TEXT,
            guardian_email TEXT
        )
    ''')
    
    conn.commit()
    conn.close()
    
    print("\n✅ SUCCESS: Database is now EMPTY.")
    print("   - The AI Model is still trained and ready.")
    print("   - The Dashboard will show 0 students until you register one.")

if __name__ == "__main__":
    reset_db()