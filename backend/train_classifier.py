import pandas as pd
from sentence_transformers import SentenceTransformer
from sklearn.linear_model import LogisticRegression
import joblib
import numpy as np

def train_model():
    print("1. Loading the massive CUAD master_clauses.csv...")
    # Ensure master_clauses.csv is in your backend folder!
    df = pd.read_csv('master_clauses.csv')

    risky_categories = ['Uncapped Liability', 'Non-Compete', 'Liquidated Damages', 'Exclusivity', 'Price Restriction']
    safe_categories = ['Governing Law', 'Parties', 'License Grant']

    extracted_data = []

    print("2. Extracting real-world clauses...")
    for index, row in df.iterrows():
        for category in risky_categories:
            if category in df.columns:
                clause_text = str(row[category])
                if clause_text.lower() != 'nan' and len(clause_text) > 20:
                    extracted_data.append({'text': clause_text, 'is_predatory': 1})
        
        for category in safe_categories:
            if category in df.columns:
                clause_text = str(row[category])
                if clause_text.lower() != 'nan' and len(clause_text) > 20:
                    extracted_data.append({'text': clause_text, 'is_predatory': 0})

    clean_df = pd.DataFrame(extracted_data).drop_duplicates(subset=['text']).sample(frac=1).reset_index(drop=True)
    print(f"✅ Extracted {len(clean_df)} real legal clauses!")

    texts = clean_df['text'].tolist()
    labels = clean_df['is_predatory'].tolist()
    
    print("3. Generating vector embeddings (This will take a few minutes as LegalBERT is larger)...")
    encoder = SentenceTransformer('nlpaueb/legal-bert-base-uncased')
    X = encoder.encode(texts)
    
    # --- CRITICAL BUG FIX: Convert any NaN values to 0 ---
    X = np.nan_to_num(X)
    y = np.array(labels)
    
    print("4. Training ML Classifier...")
    # C=10.0 allows the model to learn more complex patterns
# class_weight forces it to care 10x more about Predatory (1) than Safe (0)
    clf = LogisticRegression(class_weight={0: 1, 1: 10}, C=10.0, max_iter=1000)
    clf.fit(X, y)
    
    print("5. Saving trained model...")
    joblib.dump(clf, 'risk_classifier.pkl')
    print("🎉 SUCCESS! The CUAD 'Big Brain' is trained and saved as 'risk_classifier.pkl'!")

if __name__ == "__main__":
    train_model()