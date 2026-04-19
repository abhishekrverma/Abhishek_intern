# EduGuard AI — Academic Risk Management & Early Warning System

EduGuard AI is a sophisticated academic risk management platform designed to help educational institutions proactively identify, analyze, and assist students who may be at risk of academic underperformance or dropout. 

By unifying data points from academic results, attendance, participation behaviors, and qualitative faculty feedback (using NLP), EduGuard's built-in Machine Learning engine classifies students into risk tiers (Low, Moderate, High) and provides actionable insights.

---

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph Frontend "Frontend (Next.js + React.js + TailwindCSS)"
        UI[User Interface]
        AuthUI[Authentication UI]
        DashUI[Dashboard & Analytics]
        StudentUI[Student Lookup Profiles]
        RegUI[Student Registration]
    end

    subgraph Backend "Backend (FastAPI + Python)"
        API[FastAPI Router]
        Auth[JWT & Bcrypt Auth]
        ML[Machine Learning Pipeline]
        NLP[TextBlob NLP Engine]
        Email[SMTP Notification Service]
    end

    subgraph Database "Database (MySQL Server)"
        DB[(MySQL Database)]
        tbl_users[Users Table - Admin/Faculty]
        tbl_students[Students Table - Academic & Behavioral]
    end
    
    subgraph Storage "File Storage"
        ModelData[(model.pkl)]
        ModelMetrics[(model_metrics.json)]
    end

    %% Flow connections
    UI <-->|HTTP/REST| API
    AuthUI <-->|POST /login, /signup| Auth
    API --> Auth
    API --> ML
    API --> NLP
    API --> Email
    API <-->|SQL Queries| DB
    
    %% DB Data flows
    tbl_users -.-> Auth
    tbl_students -.-> API

    %% ML Flows
    ML -.->|Loads| ModelData
    ML -.->|Reads| ModelMetrics
```

---

## 🛠️ Technology Stack

**Frontend:**
- **Framework:** Next.js (React) using the modern App Router.
- **Styling:** Tailwind CSS to create a premium, glassmorphism-inspired aesthetic with micro-animations.
- **Icons:** Lucide React for consistent and crisp vector iconography.
- **HTTP Client:** Axios for robust asynchronous data fetching from the backend.
- **Charting:** Recharts for dynamic and responsive data visualization mapping model outputs.

**Backend:**
- **Framework:** FastAPI (Python) for ultra-fast, modern API performance with automatic Swagger documentation.
- **Database:** MySQL relational database.
- **ORM / Driver:** `mysql-connector-python` with `Dictionary Cursors` for seamless JSON serialization.
- **Security:** `bcrypt` for one-way salting and hashing of passwords. Custom CORS middleware configurations.
- **Email System:** Real SMTP integration using `smtplib` and `MIMEText` for structured email dispatch via Gmail.

**Artificial Intelligence & Machine Learning:**
- **Predictive Model:** Random Forest Classifier via `scikit-learn`, optimized for tabular multi-classification.
- **Data Engineering:** `pandas` for dataframe manipulation and `StandardScaler` to normalize student metrics.
- **NLP Analysis:** `TextBlob` utilized for mathematical Sentiment Analysis (Polarity), Subjectivity, and Lexical Richness Heuristics.

---

## ✨ Detailed Features & Capabilities

### 1. Robust AI & Machine Learning Pipeline
EduGuard doesn't rely solely on grades; it uses a multi-faceted approach to accurately predict student risk levels:
* **Multi-Factor Risk Prediction:** The `RandomForestClassifier` consumes 8 distinct parameters per student (Math, Reading, Writing scores, GPA, Attendance Rate, Participation Score, Late Submissions, and NLP Sentiment polarity). It outputs a prediction of `0 (Low Risk)`, `1 (Moderate Risk)`, or `2 (High Risk)` along with a confidence percentage.
* **Natural Language Processing (NLP) - Sentiment:** The platform uses `TextBlob` to scan standard faculty feedback notes regarding a student. It calculates an emotional "polarity" score between -1.0 (highly negative/distressed) and 1.0 (highly positive/motivated), feeding this directly into the ML risk calculation.
* **Natural Language Processing (NLP) - Auto-Grading:** EduGuard features a dedicated feature to auto-grade student essay text. The system evaluates the text array based on word count (length penalty), lexical richness (unique vocabulary ratio), and subjectivity patterns to yield an automated score from 0-100 without manual human grading.
* **Actionable "Feature Importance" Maps:** The model self-evaluates during training to export a JSON mapping of which factors are currently driving risk designations the most (e.g., Attendance vs Read Score), allowing administrators to pivot institutional focus. 
* **Bulk AI Recalibration:** Because AI models and thresholds change, the backend exposes an endpoint (`/analytics/regenerate_all`) enabling admins to bulk re-evaluate all students in the database against the newest iteration of the text-scoring NLP logic.

### 2. Comprehensive Dashboard & Analytics
The nerve center of the application, designed for deep visibility into student bodies:
* **Real-time Overview Cards:** At-a-glance metrics count total matriculated students and partition them instantly into Safe Zone, Moderate Risk, and High Risk segments.
* **Distribution Charts:** Interactive visual bar charts powered by Recharts that map how grades (Math, Reading, Writing) are distributed across demographic bins, allowing administrators to spot bell curve anomalies.
* **Recent Activity Feed:** An automated event log that monitors newly onboarded students in real time, giving faculty immediate insight into the newest data entries.
* **Filtering and Pagination:** The main data table permits dynamic grouping by Risk Tier so that faculty can hyper-focus strictly on high-risk students without clutter.

### 3. Student Identification and Reporting profiles
* **Deep Student Lookups:** A dedicated search UI allowing specific querying of a student's ID (e.g. `STU_001`) to parse their entire data schema.
* **AI-Generated Action Narratives:** Based on the mathematical output of the risk model and the specific subjects where the student struggles, the AI generates a customized, human-readable paragraph advising exactly what steps faculty should take (e.g., "Immediate intervention requested due to critically distressed linguistic indicators.")

### 4. Automated SMTP Alerting System
EduGuard includes a direct communication bridge between the system and guardians over real email:
* **Targeted Individual Alerts:** Upon analyzing a student profile, a faculty member can trigger an immediate contextual email to the registered guardian. The email is dynamically constructed using the student's exact GPA, grades, and risk tiers before dispatch.
* **Bulk High-Risk Warning:** For institutional efficiency, a single-click "Bulk Alert" command traverses the entire MySQL dataset. It recalculates the model prediction for every student, and if a student maintains a "High Risk" designation, it silently queues and fires a unique, customized intervention email to the corresponding guardian.

### 5. Enterprise-Grade Security & Authentication
Data privacy is paramount, leading to a sealed API infrastructure:
* **Complete Auth Flow:** Features secure, stylized Login and Signup portals targeting Admin and Faculty roles. Unknown visitors cannot bypass these pages to reach the dashboard.
* **Advanced Hashing:** At the time of account creation, passwords are encrypted utilizing the `bcrypt` library. Passwords are salted and hashed natively inside Python before inserting into MySQL, ensuring that a database compromise yields no plaintext credentials.
* **Relational Database Design:** System logic migrated flawlessly from local SQLite files into robust, scalable MySQL structures—with separate tables for `users` (credentials) and `students` (vital statistics).

---

## 🚀 Setup & Installation

> **Prerequisite:** You must have **MySQL Community Server 8.0+** running locally on port 3306.

### 1. Database Setup
1. Open the `.env` file in the `backend/` directory.
2. Fill out your MySQL connection configuration alongside your SMTP details:
   ```env
   MAIL_USERNAME=your_real_gmail@gmail.com
   MAIL_PASSWORD=your_app_password
   MYSQL_HOST=localhost
   MYSQL_USER=root
   MYSQL_PASSWORD=your_mysql_password
   MYSQL_DATABASE=eduguard
   ```
3. Initialize the database schema and seed default users:
   ```bash
   cd backend
   python init_db.py
   ```
   *(Default Seed Users: admin/admin123 and faculty/faculty123)*

### 2. Machine Learning Initialization
Before starting the backend, you must generate synthetic training data and train the AI model:
```bash
cd backend
python process_data.py
python train_model.py
```
*(This produces `model.pkl` and `model_metrics.json` which the server relies upon.)*

### 3. Start the Backend API
Run the FastAPI application (served on port 8000):
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

### 4. Start the Frontend Application
In a separate terminal, install dependencies and run the Next.js dev server:
```bash
cd my-app
npm install
npm run dev
```
Access the application by navigating to **http://localhost:3000** in your browser.

---

## 📋 Available Commands & Tools

- `simulate_new_student.py`: CLI tool for testing data insertion bypassing the frontend.
- `reset_database.py`: Performs a full tear-down of the MySQL tables (erases students) whilst maintaining the Admin/Faculty authentication seeds. Useful for testing fresh states.
