import pandas as pd
import random
import numpy as np
import os

# --- Configuration ---
INPUT_FILE = 'data/StudentsPerformance.csv'
OUTPUT_FILE = 'data/master_dataset.csv'
TARGET_SIZE = 10000  # We want 10,000 records
RANDOM_SEED = 42

np.random.seed(RANDOM_SEED)
random.seed(RANDOM_SEED)

print(f"🚀 Starting Hybrid Pipeline (Kaggle + Synthetic NLP)...")

# 1. Load Real Kaggle Data
if not os.path.exists(INPUT_FILE):
    print(f"❌ Error: '{INPUT_FILE}' not found. Please put the Kaggle CSV there.")
    exit()

df_real = pd.read_csv(INPUT_FILE)
print(f"✅ Loaded Base Data: {len(df_real)} real records")

# 2. Upscale to 10,000 Records (Bootstrapping)
print(f"⚙️  Upscaling to {TARGET_SIZE} records...")
df_upscaled = df_real.sample(n=TARGET_SIZE, replace=True, random_state=RANDOM_SEED).reset_index(drop=True)

# Add "Noise" to grades so duplicates aren't identical
# (Adding random value between -5 and +5 to every score)
for col in ['math score', 'reading score', 'writing score']:
    noise = np.random.randint(-5, 6, size=TARGET_SIZE)
    df_upscaled[col] = df_upscaled[col] + noise
    df_upscaled[col] = df_upscaled[col].clip(0, 100)

# Generate Unique IDs
df_upscaled['Student_ID'] = [f"STU{i+10000}" for i in range(TARGET_SIZE)]

# 3. Generate Feedback & Risk Labels with STOCHASTIC OVERLAP
#    (Prevents data leakage: boundary students get probabilistic labels)
print("📝 Generating correlated feedback text with stochastic boundaries...")

# Expanded feedback pools (more varied and realistic)
positive_texts = [
    "I am satisfied with my performance and feel well-prepared.",
    "The test was manageable and I understood most concepts.",
    "I feel confident about my progress this semester.",
    "I love this subject and enjoy the classes.",
    "Great learning experience, the teacher is very helpful.",
    "I am doing well and understanding the concepts clearly.",
    "I consistently complete assignments on time and enjoy learning.",
    "My study habits are strong and I feel on track.",
    "I participate actively in class discussions.",
    "I find the coursework challenging but rewarding.",
    "I'm motivated to keep improving my grades.",
    "The study materials are excellent and easy to follow.",
    "I enjoy group projects and collaborative learning.",
    "My confidence in this subject has grown significantly.",
    "I feel supported by my teachers and peers."
]

neutral_texts = [
    "I did okay but could do better with more effort.",
    "The exam was average difficulty for me.",
    "I need to study more consistently going forward.",
    "It was fine, not great. I have room to improve.",
    "I understand the basics but struggle with advanced topics.",
    "Some topics are clear but others are confusing.",
    "I attend classes regularly but don't always pay attention.",
    "I sometimes fall behind on homework but catch up eventually.",
    "My performance varies a lot depending on the subject.",
    "I feel neutral about school, neither excited nor worried.",
    "I think I could do better if I focused more.",
    "The workload is manageable but sometimes overwhelming.",
    "I understand lectures but struggle with practice problems.",
    "I need more time to grasp certain concepts.",
    "My grades are acceptable but not where I want them."
]

negative_texts = [
    "I struggled a lot with the material this term.",
    "I am disappointed with my scores and feel lost.",
    "I think I might fail this course without help.",
    "The questions were confusing and I couldn't finish on time.",
    "I am stressed and falling behind in multiple subjects.",
    "I don't understand the lectures at all anymore.",
    "I feel overwhelmed by the amount of work assigned.",
    "I have difficulty concentrating during class.",
    "I missed several classes and can't catch up.",
    "I feel anxious about exams and my future.",
    "I'm considering dropping out because I can't keep up.",
    "The course material is too difficult for me.",
    "I have no motivation to study anymore.",
    "I feel isolated and don't have anyone to help me.",
    "My home situation makes it hard to focus on studies."
]

feedback_list = []
risk_labels = []
gpa_list = []
attendance_list = []
participation_list = []
late_list = []

for index, row in df_upscaled.iterrows():
    avg = (row['math score'] + row['reading score'] + row['writing score']) / 3

    # STOCHASTIC OVERLAP ZONES for realistic bounds
    if avg >= 75:
        text = random.choice(positive_texts)
        risk = 0
    elif avg >= 65:
        if random.random() < 0.75:
            text = random.choice(positive_texts)
            risk = 0
        else:
            text = random.choice(neutral_texts)
            risk = 1
    elif avg >= 55:
        rand_val = random.random()
        if rand_val < 0.15:
            text = random.choice(positive_texts)
            risk = 0
        elif rand_val < 0.80:
            text = random.choice(neutral_texts)
            risk = 1
        else:
            text = random.choice(negative_texts)
            risk = 2
    elif avg >= 45:
        rand_val = random.random()
        if rand_val < 0.30:
            text = random.choice(neutral_texts)
            risk = 1
        else:
            text = random.choice(negative_texts)
            risk = 2
    else:
        text = random.choice(negative_texts)
        risk = 2

    # Noise injection
    if random.random() < 0.05:
        if risk == 0:
            text = random.choice(neutral_texts)
        elif risk == 2:
            text = random.choice(neutral_texts)

    # Generate new Academic & Behavioral Features correlated with Risk
    gpa = round(max(0.0, min(4.0, (avg / 25.0) + random.uniform(-0.4, 0.4))), 2)
    
    if risk == 0:
        attendance = random.randint(85, 100)
        participation = random.randint(75, 100)
        late = random.randint(0, 2)
    elif risk == 1:
        attendance = random.randint(70, 90)
        participation = random.randint(50, 85)
        late = random.randint(1, 5)
    else:
        attendance = random.randint(40, 75)
        participation = random.randint(10, 50)
        late = random.randint(4, 15)

    feedback_list.append(text)
    risk_labels.append(risk)
    gpa_list.append(gpa)
    attendance_list.append(attendance)
    participation_list.append(participation)
    late_list.append(late)

df_upscaled['Feedback_Text'] = feedback_list
df_upscaled['Risk_Level'] = risk_labels
df_upscaled['gpa'] = gpa_list
df_upscaled['attendance_rate'] = attendance_list
df_upscaled['participation_score'] = participation_list
df_upscaled['late_submissions'] = late_list

# 4. Print class distribution
print("\n📊 Risk Level Distribution:")
print(df_upscaled['Risk_Level'].value_counts().sort_index().to_string())

# 5. Save the Final Merged File
df_upscaled.to_csv(OUTPUT_FILE, index=False)

print(f"\n🎉 SUCCESS! Generated '{OUTPUT_FILE}' with {len(df_upscaled)} records.")
print(df_upscaled[['Student_ID', 'math score', 'Feedback_Text', 'gpa', 'attendance_rate', 'Risk_Level']].head(5))