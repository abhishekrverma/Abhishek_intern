import sqlite3
import pandas as pd
import os

# Configuration
CSV_FILE = 'data/master_dataset.csv'
DB_FILE = 'student_system.db'

def init_database():
    print("📦 Initializing Database...")
    
    # 1. Load the CSV Data
    if not os.path.exists(CSV_FILE):
        print(f"❌ Error: {CSV_FILE} not found. Run process_data.py first.")
        return
    
    df = pd.read_csv(CSV_FILE)
    
    # 2. Connect to SQLite (Creates file if missing)
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # 3. Create Table Schema
    # We store the raw data. The Risk prediction happens LIVE.
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS students (
            student_id TEXT PRIMARY KEY,
            math_score INTEGER,
            reading_score INTEGER,
            writing_score INTEGER,
            feedback_text TEXT,
            guardian_email TEXT  -- Added for your future email feature
        )
    ''')
    
    # 4. Insert Data
    print(f"⚙️  Migrating {len(df)} records to SQL...")
    
    # We add a fake email for every student for the future feature
    df['guardian_email'] = "parent_" + df['Student_ID'] + "@example.com"
    
    # Select only the columns we need to match the SQL table
    # Rename columns to match SQL schema if necessary
    sql_data = df[['Student_ID', 'math score', 'reading score', 'writing score', 'Feedback_Text', 'guardian_email']]
    sql_data.columns = ['student_id', 'math_score', 'reading_score', 'writing_score', 'feedback_text', 'guardian_email']
    
    # Bulk write to SQL
    sql_data.to_sql('students', conn, if_exists='replace', index=False)
    
    conn.commit()
    conn.close()
    
    print(f"✅ Success! Database '{DB_FILE}' is ready.")

if __name__ == "__main__":
    init_database();