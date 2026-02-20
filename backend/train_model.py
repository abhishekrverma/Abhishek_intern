import pandas as pd
from textblob import TextBlob
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import pickle
import os

DATA_FILE = 'data/master_dataset.csv'

def train():
    print("🚀 Training Model on Hybrid Data...")
    
    if not os.path.exists(DATA_FILE):
        print(f"❌ Error: {DATA_FILE} not found. Run process_data.py first.")
        return

    # 1. Load Data
    df = pd.read_csv(DATA_FILE)
    print(f"📊 Processing {len(df)} records...")
    
    # 2. NLP Feature Extraction
    # Convert text feedback into a number (-1.0 to 1.0)
    df['Sentiment_Score'] = df['Feedback_Text'].apply(lambda x: TextBlob(str(x)).sentiment.polarity)
    
    # 3. Define Input Features (X) and Target (y)
    # Inputs: Math, Reading, Writing, Sentiment
    X = df[['math score', 'reading score', 'writing score', 'Sentiment_Score']]
    # Target: The Risk Level (0, 1, 2) we generated
    y = df['Risk_Level']
    
    # 4. Split Data (80% Train, 20% Test)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
    
    # 5. Train Random Forest
    model = RandomForestClassifier(n_estimators=100)
    model.fit(X_train, y_train)
    
    # 6. Evaluate
    acc = model.score(X_test, y_test)
    print(f"🎯 Model Accuracy: {acc * 100:.2f}%")
    
    # 7. Save Model
    with open('model.pkl', 'wb') as f:
        pickle.dump(model, f)
    print("💾 Model saved as 'model.pkl' - Ready for API.")

if __name__ == "__main__":
    train()