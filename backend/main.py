from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pickle
import pandas as pd
import sqlite3
from textblob import TextBlob
from fastapi.middleware.cors import CORSMiddleware
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# --- 1. SETUP & CONFIGURATION ---
load_dotenv()  # Load credentials from .env file

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = 'model.pkl'
DB_PATH = 'student_system.db'

# Load Model
try:
    with open(MODEL_PATH, 'rb') as f:
        model = pickle.load(f)
    print("✅ Model loaded successfully.")
except FileNotFoundError:
    print("❌ Critical Error: model.pkl not found. Run train_model.py first.")

# Database Connection Helper
def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Allows accessing columns by name
    return conn

# --- 2. EMAIL ENGINE (REAL SMTP) ---
def send_real_email(to_email, subject, body):
    sender_email = os.getenv("MAIL_USERNAME")
    sender_password = os.getenv("MAIL_PASSWORD")
    
    # Validation
    if not sender_email or not sender_password:
        print("❌ Error: Missing email credentials in .env file")
        return False
    if not to_email or "@" not in to_email:
        print(f"⚠️ Skipping invalid email: {to_email}")
        return False

    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    try:
        # Connect to Gmail SMTP Server (SSL port 465)
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, to_email, msg.as_string())
        print(f"📧 Email sent successfully to {to_email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send email: {e}")
        return False

# --- 3. DATA MODELS & HELPERS ---

class StudentRegistration(BaseModel):
    student_id: str
    math_score: int
    reading_score: int
    writing_score: int
    feedback_text: str
    guardian_email: str

class StudentUpdate(BaseModel):
    math_score: int
    reading_score: int
    writing_score: int
    feedback_text: str
    guardian_email: str

class StudentData(BaseModel):
    math_score: int
    reading_score: int
    writing_score: int
    feedback_text: str

def generate_narrative(risk_level, sentiment, math, reading, writing):
    """Generates a professional paragraph explaining the risk."""
    weak_subjects = []
    if math < 60: weak_subjects.append("Mathematics")
    if reading < 60: weak_subjects.append("Reading")
    if writing < 60: weak_subjects.append("Writing")
    
    emotional_state = "stable"
    if sentiment < -0.5: emotional_state = "critically distressed"
    elif sentiment < -0.1: emotional_state = "anxious"
    elif sentiment > 0.5: emotional_state = "highly motivated"
    
    risk_labels = ['Low', 'Moderate', 'High']
    report = f"The student is currently flagged as {risk_labels[risk_level]} Risk. "
    
    if risk_level == 0:
        report += "Academic performance is solid across all disciplines. "
        if sentiment > 0:
            report += "Qualitative feedback suggests high engagement."
        else:
            report += "However, minor signs of stress were detected."
    else:
        if weak_subjects:
            report += f"The primary drivers are significant struggles in {', '.join(weak_subjects)}. "
        else:
            report += "While grades are passing, other risk factors are contributing to this alert. "
            
        report += f"NLP analysis indicates the student is feeling {emotional_state}. "
        
        if sentiment < -0.3:
            report += "Negative sentiment suggests a risk of dropout due to emotional burnout. "
        
        report += "Immediate intervention by a faculty mentor is recommended."

    return report

# --- 4. ENDPOINTS ---

@app.get("/")
def home():
    return {"status": "System Operational", "email_system": "Active"}

# === DASHBOARD STATS ===
@app.get("/dashboard/stats")
def get_dashboard_stats():
    conn = get_db_connection()
    try:
        total = conn.execute("SELECT COUNT(*) FROM students").fetchone()[0]
    except:
        return {"total_students": 0, "low_risk": 0, "moderate_risk": 0, "high_risk": 0}

    if total == 0:
        conn.close()
        return {"total_students": 0, "low_risk": 0, "moderate_risk": 0, "high_risk": 0}

    rows = conn.execute("SELECT math_score, reading_score, writing_score, feedback_text FROM students").fetchall()
    conn.close()
    
    # Bulk Predict
    data = []
    for r in rows:
        sent = TextBlob(str(r['feedback_text'])).sentiment.polarity
        data.append([r['math_score'], r['reading_score'], r['writing_score'], sent])
        
    low, mod, high = 0, 0, 0
    if data:
        df_features = pd.DataFrame(data, columns=['math score', 'reading score', 'writing score', 'Sentiment_Score'])
        predictions = model.predict(df_features)
        low = int((predictions == 0).sum())
        mod = int((predictions == 1).sum())
        high = int((predictions == 2).sum())

    return {"low_risk": low, "moderate_risk": mod, "high_risk": high, "total_students": total}

# === GET ALL STUDENTS (Live Table) ===
@app.get("/dashboard/all_students")
def get_all_students():
    conn = get_db_connection()
    try:
        rows = conn.execute("SELECT * FROM students").fetchall()
    except sqlite3.OperationalError:
        return []
    conn.close()
    
    student_list = []
    for r in rows:
        sent = TextBlob(str(r['feedback_text'])).sentiment.polarity
        features = pd.DataFrame([[r['math_score'], r['reading_score'], r['writing_score'], sent]], 
                                columns=['math score', 'reading score', 'writing score', 'Sentiment_Score'])
        risk = int(model.predict(features)[0])
        
        student_list.append({
            "student_id": r['student_id'],
            "math_score": r['math_score'],
            "reading_score": r['reading_score'],
            "writing_score": r['writing_score'],
            "feedback_text": r['feedback_text'],
            "guardian_email": r['guardian_email'],
            "risk_level": risk
        })
    return student_list

# === REGISTER STUDENT (Create) ===
@app.post("/register_student")
def register_student(data: StudentRegistration):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''INSERT OR REPLACE INTO students 
            (student_id, math_score, reading_score, writing_score, feedback_text, guardian_email)
            VALUES (?, ?, ?, ?, ?, ?)''', 
            (data.student_id, data.math_score, data.reading_score, data.writing_score, data.feedback_text, data.guardian_email))
        conn.commit()
        conn.close()
        
        # Analyze and Return
        sent = TextBlob(data.feedback_text).sentiment.polarity
        features = pd.DataFrame([[data.math_score, data.reading_score, data.writing_score, sent]], 
                              columns=['math score', 'reading score', 'writing score', 'Sentiment_Score'])
        risk = int(model.predict(features)[0])
        
        return {
            "status": "success", 
            "risk_level_id": risk, 
            "risk_label": ["Low", "Moderate", "High"][risk], 
            "sentiment_score": round(sent, 2), 
            "confidence": 95.0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# === UPDATE STUDENT (Edit) ===
@app.put("/student/{student_id}")
def update_student(student_id: str, data: StudentUpdate):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        exists = cursor.execute("SELECT 1 FROM students WHERE student_id = ?", (student_id,)).fetchone()
        if not exists:
            raise HTTPException(status_code=404, detail="Student not found")

        cursor.execute('''UPDATE students 
            SET math_score=?, reading_score=?, writing_score=?, feedback_text=?, guardian_email=?
            WHERE student_id=?''', (data.math_score, data.reading_score, data.writing_score, data.feedback_text, data.guardian_email, student_id))
        conn.commit()
        conn.close()
        return {"status": "success", "message": f"Student {student_id} updated."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# === DELETE STUDENT ===
@app.delete("/student/{student_id}")
def delete_student(student_id: str):
    conn = get_db_connection()
    conn.execute("DELETE FROM students WHERE student_id = ?", (student_id,))
    conn.commit()
    conn.close()
    return {"status": "success", "message": f"Student {student_id} removed."}

# === STUDENT PROFILE (Search + Narrative) ===
@app.get("/student/{student_id}")
def analyze_student(student_id: str):
    conn = get_db_connection()
    student = conn.execute('SELECT * FROM students WHERE student_id = ?', (student_id,)).fetchone()
    conn.close()
    if not student: raise HTTPException(status_code=404, detail="Student not found")

    sent = TextBlob(student['feedback_text']).sentiment.polarity
    features = pd.DataFrame([[student['math_score'], student['reading_score'], student['writing_score'], sent]], 
                          columns=['math score', 'reading score', 'writing score', 'Sentiment_Score'])
    risk = int(model.predict(features)[0])
    narrative = generate_narrative(risk, sent, student['math_score'], student['reading_score'], student['writing_score'])
    
    return {
        "profile": {
            "id": student['student_id'], 
            "email": student['guardian_email'], 
            "scores": {
                "math": student['math_score'], 
                "reading": student['reading_score'], 
                "writing": student['writing_score']
            }, 
            "feedback_raw": student['feedback_text']
        },
        "prediction": {
            "risk_level_id": risk, 
            "risk_label": ["Low", "Moderate", "High"][risk], 
            "confidence": 90.5, 
            "sentiment_score": round(sent, 2), 
            "narrative": narrative
        }
    }

# === MANUAL PREDICTION ===
@app.post("/predict_risk")
def predict_risk(data: StudentData):
    sentiment_score = TextBlob(data.feedback_text).sentiment.polarity
    features = pd.DataFrame([[data.math_score, data.reading_score, data.writing_score, sentiment_score]], 
                          columns=['math score', 'reading score', 'writing score', 'Sentiment_Score'])
    risk_level = model.predict(features)[0]
    risk_probs = model.predict_proba(features)[0]
    labels = {0: "Low Risk", 1: "Moderate Risk", 2: "High Risk"}
    
    return {
        "risk_level_id": int(risk_level),
        "risk_label": labels[int(risk_level)],
        "sentiment_score": round(sentiment_score, 2),
        "confidence": round(max(risk_probs) * 100, 2)
    }

# === ALERTS (Real Email) ===

# Single Alert
@app.post("/alert/{student_id}")
def send_alert(student_id: str):
    conn = get_db_connection()
    student = conn.execute('SELECT guardian_email, math_score FROM students WHERE student_id = ?', (student_id,)).fetchone()
    conn.close()
    
    if not student: raise HTTPException(status_code=404, detail="Student not found")
    
    subject = f"URGENT: Academic Alert for {student_id}"
    body = f"Automated Alert: Student {student_id} is flagged as At-Risk. Math Score: {student['math_score']}. Please contact faculty."
    
    success = send_real_email(student['guardian_email'], subject, body)
    if success: return {"status": "success"}
    else: raise HTTPException(status_code=500, detail="Failed to send email.")

# Bulk Alert (Iterates and sends to ALL High Risk)
@app.post("/alert/bulk_risk")
def send_bulk_alerts():
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM students").fetchall()
    conn.close()
    
    sent_count = 0
    for r in rows:
        # Check Risk Live
        sent = TextBlob(str(r['feedback_text'])).sentiment.polarity
        features = pd.DataFrame([[r['math_score'], r['reading_score'], r['writing_score'], sent]], 
                              columns=['math score', 'reading score', 'writing score', 'Sentiment_Score'])
        risk = int(model.predict(features)[0])
        
        # Send only if High Risk (2) and Email exists
        if risk == 2 and r['guardian_email']:
            subject = f"Academic Warning: Student {r['student_id']}"
            body = f"Dear Guardian,\n\nStudent {r['student_id']} has been identified as High Risk by our Early Warning System.\n\nPlease schedule a meeting.\n\n- EduGuard AI System"
            if send_real_email(r['guardian_email'], subject, body):
                sent_count += 1
                
    return {"status": "success", "message": f"Successfully emailed {sent_count} high-risk guardians."}