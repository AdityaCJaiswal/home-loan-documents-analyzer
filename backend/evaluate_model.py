import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import time
import warnings
warnings.filterwarnings('ignore')

print("1. Loading the CUAD dataset...")
df = pd.read_csv('master_clauses.csv')

risky_categories = ['Uncapped Liability', 'Non-Compete', 'Liquidated Damages', 'Exclusivity', 'Price Restriction']
safe_categories = ['Governing Law', 'Parties', 'License Grant']

extracted_data = []

for index, row in df.iterrows():
    for category in risky_categories:
        if category in df.columns and str(row[category]).lower() != 'nan' and len(str(row[category])) > 20:
            extracted_data.append({'text': str(row[category]), 'is_predatory': 1})
    
    for category in safe_categories:
        if category in df.columns and str(row[category]).lower() != 'nan' and len(str(row[category])) > 20:
            extracted_data.append({'text': str(row[category]), 'is_predatory': 0})

clean_df = pd.DataFrame(extracted_data).drop_duplicates(subset=['text']).sample(frac=1, random_state=42).reset_index(drop=True)

texts = clean_df['text'].tolist()
labels = clean_df['is_predatory'].tolist()

print("2. Generating vector embeddings...")
encoder = SentenceTransformer('all-MiniLM-L6-v2')
X = encoder.encode(texts)
X = np.nan_to_num(X)
y = np.array(labels)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("3. Training the Random Forest model on 80% of the data...")
# Random Forest inherently handles imbalanced data much better without becoming "paranoid"
clf = RandomForestClassifier(n_estimators=100, class_weight='balanced', random_state=42)
clf.fit(X_train, y_train)

print("\n" + "="*50)
print(" 📊 REDLINE AI: MODEL PERFORMANCE REPORT 📊")
print("="*50)

start_time = time.time()
predictions = clf.predict(X_test)
end_time = time.time()

time_taken = end_time - start_time
clauses_tested = len(X_test)
speed_per_clause = time_taken / clauses_tested if clauses_tested > 0 else 0

print(f"\n⚡ EFFICIENCY (SPEED)")
print(f"- Processed {clauses_tested} unseen clauses in: {time_taken:.4f} seconds")

accuracy = accuracy_score(y_test, predictions)
print(f"\n🎯 OVERALL ACCURACY: {accuracy * 100:.2f}%")

print("\n📈 DETAILED METRICS (Precision & Recall):")
print(classification_report(y_test, predictions, target_names=['Safe Clause', 'Predatory Risk']))

print("\n🧩 CONFUSION MATRIX:")
cm = confusion_matrix(y_test, predictions)
print(f"True Negatives (Correctly marked Safe): {cm[0][0]}")
print(f"False Positives (Falsely flagged as Risk): {cm[0][1]}")
print(f"False Negatives (Missed a real Risk): {cm[1][0]}")
print(f"True Positives (Correctly caught Risk): {cm[1][1]}")
print("="*50)