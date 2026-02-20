import pandas as pd
import random
import numpy as np
import os

# --- Configuration ---
INPUT_FILE = 'data/StudentsPerformance.csv'
OUTPUT_FILE = 'data/master_dataset.csv'
TARGET_SIZE = 10000  # We want 10,000 records

print(f"🚀 Starting Hybrid Pipeline (Kaggle + Synthetic NLP)...")

# 1. Load Real Kaggle Data
if not os.path.exists(INPUT_FILE):
    print(f"❌ Error: '{INPUT_FILE}' not found. Please put the Kaggle CSV there.")
    exit()

df_real = pd.read_csv(INPUT_FILE)
print(f"✅ Loaded Base Data: {len(df_real)} real records")

# 2. Upscale to 10,000 Records (Bootstrapping)
print(f"⚙️  Upscaling to {TARGET_SIZE} records...")
# Sample with replacement to reach 10k
df_upscaled = df_real.sample(n=TARGET_SIZE, replace=True).reset_index(drop=True)

# Add "Noise" to grades so duplicates aren't identical
# (Adding random value between -4 and +4 to every score)
for col in ['math score', 'reading score', 'writing score']:
    noise = np.random.randint(-4, 5, size=TARGET_SIZE)
    df_upscaled[col] = df_upscaled[col] + noise
    df_upscaled[col] = df_upscaled[col].clip(0, 100) # Keep within 0-100

# Generate Unique IDs
df_upscaled['Student_ID'] = [f"STU{i+10000}" for i in range(TARGET_SIZE)]

# 3. Generate Matching Feedback (The "Merger" Logic)
print("📝 Generating correlated feedback text...")

positive_texts = [
    "I am satisfied with my performance.", "The test was easy.", 
    "I feel confident.", "I love this subject.", "Great learning experience.",
    "I am doing well and understanding the concepts."
]
neutral_texts = [
    "I did okay but could do better.", "The exam was average.", 
    "I need to study more.", "It was fine, not great.",
    "I understand the basics but struggle with details."
]
negative_texts = [
    "I struggled a lot.", "I am disappointed with my score.", 
    "I think I failed.", "The questions were confusing.",
    "I am stressed and falling behind.", "I don't understand the lectures."
]

feedback_list = []
risk_labels = []

for index, row in df_upscaled.iterrows():
    # Calculate Average
    avg = (row['math score'] + row['reading score'] + row['writing score']) / 3
    
    # Logic: Assign Text & Risk based on Score
    if avg >= 70:
        text = random.choice(positive_texts)
        risk = 0 # Low Risk
    elif avg >= 50:
        text = random.choice(neutral_texts)
        risk = 1 # Moderate Risk
    else:
        text = random.choice(negative_texts)
        risk = 2 # High Risk
        
    feedback_list.append(text)
    risk_labels.append(risk)

df_upscaled['Feedback_Text'] = feedback_list
df_upscaled['Risk_Level'] = risk_labels

# 4. Save the Final Merged File
df_upscaled.to_csv(OUTPUT_FILE, index=False)

print(f"\n🎉 SUCCESS! Generated '{OUTPUT_FILE}' with {len(df_upscaled)} records.")
print(df_upscaled[['Student_ID', 'math score', 'Feedback_Text', 'Risk_Level']].head())