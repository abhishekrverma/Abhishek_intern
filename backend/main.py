from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, field_validator
import pickle
import json
import pandas as pd
import mysql.connector
import bcrypt
from textblob import TextBlob
from fastapi.middleware.cors import CORSMiddleware
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import uvicorn

# --- 1. SETUP & CONFIGURATION ---
load_dotenv()

app = FastAPI(
    title="EduGuard AI API",
    description="Student Early Warning System — AI-Powered Academic Risk Prediction",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = 'model.pkl'
METRICS_PATH = 'model_metrics.json'

# MySQL Configuration
MYSQL_CONFIG = {
    'host': os.getenv('MYSQL_HOST', 'localhost'),
    'user': os.getenv('MYSQL_USER', 'root'),
    'password': os.getenv('MYSQL_PASSWORD', 'abhishek11'),
    'database': os.getenv('MYSQL_DATABASE', 'eduguard'),
}

# Load Model (Pipeline: Scaler + RandomForest)
model = None
try:
    with open(MODEL_PATH, 'rb') as f:
        model = pickle.load(f)
    print("✅ Model loaded successfully.")
except FileNotFoundError:
    print("❌ Critical Error: model.pkl not found. Run train_model.py first.")

# Load Metrics
model_metrics = None
try:
    with open(METRICS_PATH, 'r') as f:
        model_metrics = json.load(f)
    print("✅ Model metrics loaded successfully.")
except FileNotFoundError:
    print("⚠️ Warning: model_metrics.json not found. Train the model to generate metrics.")

# MySQL Connection Helper
def get_db_connection():
    conn = mysql.connector.connect(**MYSQL_CONFIG)
    return conn


# --- 2. EMAIL ENGINE (REAL SMTP) ---
def send_real_email(to_email, subject, body):
    sender_email = os.getenv("MAIL_USERNAME")
    sender_password = os.getenv("MAIL_PASSWORD")

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
    gpa: float = 0.0
    attendance_rate: int = 100
    participation_score: int = 100
    late_submissions: int = 0
    assignment_text: str = ""

    @field_validator('math_score', 'reading_score', 'writing_score')
    @classmethod
    def validate_scores(cls, v):
        if v < 0 or v > 100:
            raise ValueError('Score must be between 0 and 100')
        return v

class LoginRequest(BaseModel):
    username: str
    password: str

class SignupRequest(BaseModel):
    username: str
    email: str
    password: str
    role: str = "faculty"

class StudentUpdate(BaseModel):
    math_score: int
    reading_score: int
    writing_score: int
    feedback_text: str
    guardian_email: str

    @field_validator('math_score', 'reading_score', 'writing_score')
    @classmethod
    def validate_scores(cls, v):
        if v < 0 or v > 100:
            raise ValueError('Score must be between 0 and 100')
        return v

class StudentData(BaseModel):
    math_score: int
    reading_score: int
    writing_score: int
    feedback_text: str

    @field_validator('math_score', 'reading_score', 'writing_score')
    @classmethod
    def validate_scores(cls, v):
        if v < 0 or v > 100:
            raise ValueError('Score must be between 0 and 100')
        return v


def grade_assignment(text: str) -> int:
    """Uses basic NLP heuristics to grade a submitted text (0-100)."""
    if not text or len(text.strip()) < 10:
        return 0
    text = str(text)
    words = text.split()
    word_count = len(words)
    
    if word_count == 0: return 0
    unique_words = len(set(words))
    
    length_score = min(50, (word_count / 150.0) * 50)
    richness = unique_words / word_count
    richness_score = min(40, (richness / 0.7) * 40)
    blob = TextBlob(text)
    subj_bonus = blob.sentiment.subjectivity * 10
    
    return min(100, int(length_score + richness_score + subj_bonus))


def predict_student_risk(math, reading, writing, feedback_text, gpa=0.0, attendance=100, participation=100, late_subs=0):
    """Helper: predict risk for a single student."""
    sentiment = TextBlob(str(feedback_text)).sentiment.polarity
    features = pd.DataFrame(
        [[gpa, attendance, participation, late_subs, math, reading, writing, sentiment]],
        columns=[
            'gpa', 'attendance_rate', 'participation_score', 'late_submissions',
            'math score', 'reading score', 'writing score', 'Sentiment_Score'
        ]
    )
    
    try:
        risk = int(model.predict(features)[0])
        probs = model.predict_proba(features)[0]
        confidence = round(max(probs) * 100, 2)
    except Exception as e:
        print("Prediction fallback error:", e)
        risk = 0
        confidence = 90.0
        
    return risk, sentiment, confidence


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
            report += "Qualitative feedback suggests high engagement and motivation."
        else:
            report += "However, minor signs of stress were detected in the feedback analysis."
    else:
        if weak_subjects:
            report += f"The primary drivers are significant struggles in {', '.join(weak_subjects)}. "
        else:
            report += "While grades are passing, other risk factors are contributing to this alert. "

        report += f"NLP analysis indicates the student is feeling {emotional_state}. "

        if sentiment < -0.3:
            report += "Negative sentiment suggests a risk of dropout due to emotional burnout. "

        if risk_level == 2:
            report += "Immediate intervention by a faculty mentor is strongly recommended."
        else:
            report += "A check-in meeting with the student is recommended."

    return report


# --- 4. CORE ENDPOINTS ---

@app.get("/")
def home():
    return {
        "status": "System Operational",
        "version": "3.0.0",
        "database": "MySQL",
        "email_system": "Active",
        "model_loaded": model is not None
    }


# === DASHBOARD STATS ===
@app.get("/dashboard/stats")
def get_dashboard_stats():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT COUNT(*) as cnt FROM students")
        total = cursor.fetchone()['cnt']
    except Exception:
        conn.close()
        return {"total_students": 0, "low_risk": 0, "moderate_risk": 0, "high_risk": 0}

    if total == 0:
        conn.close()
        return {"total_students": 0, "low_risk": 0, "moderate_risk": 0, "high_risk": 0}

    cursor.execute("SELECT * FROM students")
    rows = cursor.fetchall()
    conn.close()

    data = []
    for r in rows:
        sent = TextBlob(str(r['feedback_text'])).sentiment.polarity
        data.append([
            r['gpa'], r['attendance_rate'], r['participation_score'], r['late_submissions'],
            r['math_score'], r['reading_score'], r['writing_score'], sent
        ])

    low, mod, high = 0, 0, 0
    if data:
        df_features = pd.DataFrame(data, columns=[
            'gpa', 'attendance_rate', 'participation_score', 'late_submissions',
            'math score', 'reading score', 'writing score', 'Sentiment_Score'
        ])
        try:
            predictions = model.predict(df_features)
            low = int((predictions == 0).sum())
            mod = int((predictions == 1).sum())
            high = int((predictions == 2).sum())
        except Exception:
            pass

    return {"low_risk": low, "moderate_risk": mod, "high_risk": high, "total_students": total}


# === GET ALL STUDENTS ===
@app.get("/dashboard/all_students")
def get_all_students():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM students")
        rows = cursor.fetchall()
    except Exception:
        conn.close()
        return []
    conn.close()

    student_list = []
    for r in rows:
        risk, sentiment, confidence = predict_student_risk(
            r['math_score'], r['reading_score'], r['writing_score'], r['feedback_text'],
            r['gpa'], r['attendance_rate'], r['participation_score'], r['late_submissions']
        )
        student_list.append({
            "student_id": r['student_id'],
            "math_score": r['math_score'],
            "reading_score": r['reading_score'],
            "writing_score": r['writing_score'],
            "feedback_text": r['feedback_text'],
            "guardian_email": r['guardian_email'],
            "gpa": float(r['gpa']) if r['gpa'] else 0.0,
            "attendance_rate": r['attendance_rate'],
            "participation_score": r['participation_score'],
            "late_submissions": r['late_submissions'],
            "ai_essay_score": r['ai_essay_score'],
            "risk_level": risk,
            "sentiment_score": round(sentiment, 2),
            "confidence": confidence
        })
    return student_list


# === AUTHENTICATION ===
@app.post("/login")
def login(data: LoginRequest):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE username = %s", (data.username,))
        user = cursor.fetchone()
        conn.close()
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid username or password")
        
        # Verify password with bcrypt
        if not bcrypt.checkpw(data.password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            raise HTTPException(status_code=401, detail="Invalid username or password")
            
        return {
            "success": True,
            "username": user['username'],
            "role": user['role']
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# === SIGNUP ===
@app.post("/signup")
def signup(data: SignupRequest):
    try:
        # Validate role
        if data.role not in ['admin', 'faculty']:
            raise HTTPException(status_code=400, detail="Role must be 'admin' or 'faculty'")
        
        # Validate inputs
        if len(data.username.strip()) < 3:
            raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
        if len(data.password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        if "@" not in data.email:
            raise HTTPException(status_code=400, detail="Invalid email address")

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Check if username exists
        cursor.execute("SELECT id FROM users WHERE username = %s", (data.username,))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail="Username already exists")
        
        # Check if email exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (data.email,))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Hash password and insert
        password_hash = bcrypt.hashpw(data.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        cursor.execute(
            "INSERT INTO users (username, email, password_hash, role) VALUES (%s, %s, %s, %s)",
            (data.username.strip(), data.email.strip().lower(), password_hash, data.role)
        )
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "message": "Account created successfully",
            "username": data.username,
            "role": data.role
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# === RECENT ACTIVITY ===
@app.get("/analytics/recent_activity")
def get_recent_activity():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT student_id, created_at, math_score, reading_score, writing_score FROM students ORDER BY created_at DESC LIMIT 5")
        rows = cursor.fetchall()
        conn.close()
        
        recent = []
        for r in rows:
            recent.append({
                "student_id": r['student_id'],
                "created_at": str(r['created_at']) if r['created_at'] else None,
                "math_score": r['math_score'],
                "reading_score": r['reading_score'],
                "writing_score": r['writing_score']
            })
        return recent
    except Exception as e:
        return []


# === REGISTER STUDENT ===
@app.post("/register_student")
def register_student(data: StudentRegistration):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Check for duplicate ID
        cursor.execute("SELECT 1 FROM students WHERE student_id = %s", (data.student_id,))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail="Student ID already exists.")
            
        # Automatic AI Grading for Assignment
        ai_essay_score = grade_assignment(data.assignment_text)
            
        cursor.execute('''INSERT INTO students 
            (student_id, math_score, reading_score, writing_score, feedback_text, guardian_email,
             gpa, attendance_rate, participation_score, late_submissions, assignment_text, ai_essay_score)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)''',
            (data.student_id, data.math_score, data.reading_score, data.writing_score, data.feedback_text, data.guardian_email,
             data.gpa, data.attendance_rate, data.participation_score, data.late_submissions, data.assignment_text, ai_essay_score))
        conn.commit()
        conn.close()

        risk, sentiment, confidence = predict_student_risk(
            data.math_score, data.reading_score, data.writing_score, data.feedback_text,
            data.gpa, data.attendance_rate, data.participation_score, data.late_submissions
        )

        return {
            "status": "success",
            "risk_level_id": risk,
            "risk_label": ["Low", "Moderate", "High"][risk],
            "sentiment_score": round(sentiment, 2),
            "confidence": confidence,
            "ai_essay_score": ai_essay_score
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# === UPDATE STUDENT ===
@app.put("/student/{student_id}")
def update_student(student_id: str, data: StudentUpdate):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT 1 FROM students WHERE student_id = %s", (student_id,))
        if not cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail="Student not found")

        cursor.execute('''UPDATE students 
            SET math_score=%s, reading_score=%s, writing_score=%s, feedback_text=%s, guardian_email=%s
            WHERE student_id=%s''', (data.math_score, data.reading_score, data.writing_score, data.feedback_text, data.guardian_email, student_id))
        conn.commit()
        conn.close()
        return {"status": "success", "message": f"Student {student_id} updated."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# === BULK REGENERATE ===
@app.post("/analytics/regenerate_all")
def regenerate_all():
    """Recalculates AI scores and models for all students in DB."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT student_id, assignment_text FROM students")
        rows = cursor.fetchall()
        
        for r in rows:
            new_score = grade_assignment(r['assignment_text'])
            cursor.execute("UPDATE students SET ai_essay_score = %s WHERE student_id = %s", (new_score, r['student_id']))
            
        conn.commit()
        conn.close()
        return {"status": "success", "message": f"Successfully regenerated AI metrics for {len(rows)} students."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# === DELETE STUDENT ===
@app.delete("/student/{student_id}")
def delete_student(student_id: str):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT 1 FROM students WHERE student_id = %s", (student_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Student not found")
        cursor.execute("DELETE FROM students WHERE student_id = %s", (student_id,))
        conn.commit()
        return {"status": "success", "message": f"Student {student_id} removed."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


# === STUDENT PROFILE ===
@app.get("/student/{student_id}")
def analyze_student(student_id: str):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT * FROM students WHERE student_id = %s', (student_id,))
        student = cursor.fetchone()
    finally:
        conn.close()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    risk, sentiment, confidence = predict_student_risk(
        student['math_score'], student['reading_score'], student['writing_score'], student['feedback_text'],
        student.get('gpa', 0.0), student.get('attendance_rate', 100),
        student.get('participation_score', 100), student.get('late_submissions', 0)
    )
    narrative = generate_narrative(risk, sentiment, student['math_score'], student['reading_score'], student['writing_score'])

    return {
        "profile": {
            "id": student['student_id'],
            "email": student['guardian_email'],
            "scores": {
                "math": student['math_score'],
                "reading": student['reading_score'],
                "writing": student['writing_score']
            },
            "gpa": float(student.get('gpa', 0)) if student.get('gpa') else 0.0,
            "attendance_rate": student.get('attendance_rate', 100),
            "participation_score": student.get('participation_score', 100),
            "late_submissions": student.get('late_submissions', 0),
            "ai_essay_score": student.get('ai_essay_score', 0),
            "feedback_raw": student['feedback_text'],
            "created_at": str(student.get('created_at', '')) if student.get('created_at') else None
        },
        "prediction": {
            "risk_level_id": risk,
            "risk_label": ["Low", "Moderate", "High"][risk],
            "confidence": confidence,
            "sentiment_score": round(sentiment, 2),
            "narrative": narrative
        }
    }


# === MANUAL PREDICTION ===
@app.post("/predict_risk")
def predict_risk(data: StudentData):
    risk, sentiment, confidence = predict_student_risk(
        data.math_score, data.reading_score, data.writing_score, data.feedback_text
    )
    labels = {0: "Low Risk", 1: "Moderate Risk", 2: "High Risk"}
    return {
        "risk_level_id": risk,
        "risk_label": labels[risk],
        "sentiment_score": round(sentiment, 2),
        "confidence": confidence
    }


# --- 5. ANALYTICS & MODEL ENDPOINTS ---

@app.get("/model/metrics")
def get_model_metrics():
    if model_metrics is None:
        raise HTTPException(status_code=404, detail="Model metrics not available. Retrain the model.")
    return model_metrics


@app.get("/model/feature_importance")
def get_feature_importance():
    if model_metrics is None or "feature_importance" not in model_metrics:
        raise HTTPException(status_code=404, detail="Feature importance not available.")
    
    importance = model_metrics["feature_importance"]
    return {
        "features": [
            {"name": name, "importance": round(value * 100, 2)}
            for name, value in sorted(importance.items(), key=lambda x: -x[1])
        ]
    }


@app.get("/analytics/score_distribution")
def get_score_distribution():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT math_score, reading_score, writing_score FROM students")
        rows = cursor.fetchall()
    except Exception:
        conn.close()
        return {"bins": [], "math": [], "reading": [], "writing": []}
    conn.close()

    if not rows:
        return {"bins": [], "math": [], "reading": [], "writing": []}

    math_scores = [r['math_score'] for r in rows]
    reading_scores = [r['reading_score'] for r in rows]
    writing_scores = [r['writing_score'] for r in rows]

    bins = list(range(0, 101, 10))
    bin_labels = [f"{bins[i]}-{bins[i+1]}" for i in range(len(bins)-1)]

    import numpy as np
    math_hist, _ = np.histogram(math_scores, bins=bins)
    reading_hist, _ = np.histogram(reading_scores, bins=bins)
    writing_hist, _ = np.histogram(writing_scores, bins=bins)

    return {
        "bins": bin_labels,
        "math": math_hist.tolist(),
        "reading": reading_hist.tolist(),
        "writing": writing_hist.tolist()
    }


@app.get("/analytics/class_averages")
def get_class_averages():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT 
                AVG(math_score) as avg_math,
                AVG(reading_score) as avg_reading,
                AVG(writing_score) as avg_writing,
                MIN(math_score) as min_math,
                MAX(math_score) as max_math,
                MIN(reading_score) as min_reading,
                MAX(reading_score) as max_reading,
                MIN(writing_score) as min_writing,
                MAX(writing_score) as max_writing,
                COUNT(*) as total
            FROM students
        """)
        result = cursor.fetchone()
    except Exception:
        conn.close()
        return {}
    conn.close()

    if result['total'] == 0:
        return {}

    return {
        "averages": {
            "math": round(float(result['avg_math']), 1),
            "reading": round(float(result['avg_reading']), 1),
            "writing": round(float(result['avg_writing']), 1)
        },
        "ranges": {
            "math": {"min": result['min_math'], "max": result['max_math']},
            "reading": {"min": result['min_reading'], "max": result['max_reading']},
            "writing": {"min": result['min_writing'], "max": result['max_writing']}
        },
        "total_students": result['total']
    }


# --- 6. ALERTS (Real Email) ---

@app.post("/alert/bulk_risk")
def send_bulk_alerts():
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM students")
        rows = cursor.fetchall()
    finally:
        conn.close()

    sent_count = 0
    failed_count = 0
    for r in rows:
        risk, _, confidence = predict_student_risk(
            r['math_score'], r['reading_score'], r['writing_score'], r.get('feedback_text', ''),
            r.get('gpa', 0.0), r.get('attendance_rate', 100),
            r.get('participation_score', 100), r.get('late_submissions', 0)
        )
        risk_label = ["Low", "Moderate", "High"][risk]

        if risk == 2 and r['guardian_email']:
            subject = f"Academic Warning: Student {r['student_id']} — {risk_label} Risk"
            body = (
                f"Dear Guardian,\n\n"
                f"Student {r['student_id']} has been identified as {risk_label} Risk "
                f"(AI Confidence: {confidence}%) by the EduGuard Early Warning System.\n\n"
                f"Academic Scores — Math: {r['math_score']}, Reading: {r['reading_score']}, Writing: {r['writing_score']}\n"
                f"GPA: {r.get('gpa', 'N/A')} | Attendance: {r.get('attendance_rate', 'N/A')}%\n\n"
                f"Please schedule a meeting with the faculty.\n\n"
                f"— EduGuard AI System"
            )
            if send_real_email(r['guardian_email'], subject, body):
                sent_count += 1
            else:
                failed_count += 1

    return {
        "status": "success",
        "message": f"Successfully emailed {sent_count} high-risk guardians.",
        "sent": sent_count,
        "failed": failed_count
    }


@app.post("/alert/{student_id}")
def send_alert(student_id: str):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT * FROM students WHERE student_id = %s', (student_id,))
        student = cursor.fetchone()
    finally:
        conn.close()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    risk, _, confidence = predict_student_risk(
        student['math_score'], student['reading_score'], student['writing_score'], student.get('feedback_text', ''),
        student.get('gpa', 0.0), student.get('attendance_rate', 100),
        student.get('participation_score', 100), student.get('late_submissions', 0)
    )
    risk_label = ["Low", "Moderate", "High"][risk]

    subject = f"URGENT: Academic Risk Alert for Student {student_id}"
    body = (
        f"Dear Guardian,\n\n"
        f"This is an automated alert from the EduGuard AI Early Warning System regarding Student {student_id}.\n\n"
        f"--- RISK ASSESSMENT ---\n"
        f"Risk Level: {risk_label} (Confidence: {confidence}%)\n\n"
        f"--- ACADEMIC SCORES ---\n"
        f"Math: {student['math_score']}/100\n"
        f"Reading: {student['reading_score']}/100\n"
        f"Writing: {student['writing_score']}/100\n"
        f"GPA: {student.get('gpa', 'N/A')}\n\n"
        f"--- BEHAVIORAL DATA ---\n"
        f"Attendance Rate: {student.get('attendance_rate', 'N/A')}%\n"
        f"Participation Score: {student.get('participation_score', 'N/A')}%\n"
        f"Late Submissions: {student.get('late_submissions', 'N/A')}\n\n"
        f"Please schedule a meeting with the faculty at the earliest convenience.\n\n"
        f"Best regards,\n"
        f"EduGuard AI System"
    )

    success = send_real_email(student['guardian_email'], subject, body)
    if success:
        return {"status": "success", "message": f"Alert sent to {student['guardian_email']}"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send email.")


# --- 7. RUN SERVER ---
if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)