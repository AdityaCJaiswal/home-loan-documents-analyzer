"""
evaluate_model.py
=================
Evaluates the pre-trained XGBoost multiclass severity classifier
(risk_classifier.pkl) on labeled_clauses.csv.
"""

import ast
import warnings

import joblib
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer
from sklearn.metrics import classification_report, confusion_matrix

warnings.filterwarnings("ignore")

# ── Config ────────────────────────────────────────────────────────────────────
DATA_PATH      = "test_clauses.csv"
MODEL_PATH     = "risk_classifier.pkl"
EMBED_MODEL    = "nlpaueb/legal-bert-base-uncased"
LABEL_ORDER    = ["Safe", "Low", "Medium", "High"]
# ─────────────────────────────────────────────────────────────────────────────


def load_and_clean(path: str) -> pd.DataFrame:
    """Load CSV, drop nulls, extract plain text from list-wrapped Clause_Text."""
    print(f"\n[1/4] Loading dataset from '{path}' ...")
    df = pd.read_csv(path)

    required = {"Clause_Type", "Clause_Text", "Severity_Label"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Missing columns in CSV: {missing}")

    df = df.dropna(subset=["Clause_Text", "Severity_Label"]).copy()

    # Clause_Text is stored as a Python list string, e.g. "['some text', '...']"
    def extract_text(raw):
        try:
            items = ast.literal_eval(str(raw))
            if isinstance(items, list):
                return " ".join(str(i) for i in items)
        except Exception:
            pass
        return str(raw)

    df["clean_text"] = df["Clause_Text"].apply(extract_text)

    # Prefix clause type so the model learns type-specific patterns
    df["input_text"] = df["Clause_Type"].fillna("Unknown") + " [SEP] " + df["clean_text"]

    # Normalise label casing
    df["Severity_Label"] = df["Severity_Label"].str.strip().str.capitalize()
    df = df[df["Severity_Label"].isin(LABEL_ORDER)]

    # Remove very short texts (likely parse failures)
    df = df[df["clean_text"].str.len() > 20].drop_duplicates(subset=["clean_text"])

    print(f"    [OK] {len(df):,} valid clauses retained.")
    return df.reset_index(drop=True)


def generate_embeddings(texts: list[str]) -> np.ndarray:
    """Generate LegalBERT sentence embeddings with NaN guard."""
    print(f"\n[2/4] Generating LegalBERT embeddings for {len(texts):,} clauses ...")
    encoder = SentenceTransformer(EMBED_MODEL)
    X = encoder.encode(texts, show_progress_bar=True, batch_size=32)
    X = np.nan_to_num(X, nan=0.0, posinf=0.0, neginf=0.0)
    print(f"    [OK] Embedding matrix shape: {X.shape}")
    return X


def evaluate():
    print("=" * 65)
    print("  Severity Classifier Evaluation  (XGBoost + LegalBERT)")
    print("=" * 65)
    
    # 1. Load data
    df = load_and_clean(DATA_PATH)
    
    # 2. Load Model & LabelEncoder
    print(f"\n[3/4] Loading model and label encoder from '{MODEL_PATH}' ...")
    bundle = joblib.load(MODEL_PATH)
    clf = bundle["model"]
    le = bundle["label_encoder"]
    
    # Only keep rows where the severity label is known to the model
    valid_labels = set(le.classes_)
    df = df[df["Severity_Label"].isin(valid_labels)].reset_index(drop=True)
    
    # Extract ground truth labels using the label encoder
    y_true = le.transform(df["Severity_Label"])
    
    # 3. Generate Embeddings
    X = generate_embeddings(df["input_text"].tolist())
    
    # 4. Evaluate
    print("\n[4/4] Evaluating on the dataset ...")
    y_pred = clf.predict(X)
    
    print("\n── Evaluation Classification Report ──────────────────────────────")
    print(classification_report(y_true, y_pred, target_names=le.classes_))
    
    print("── Confusion Matrix (rows=True, cols=Predicted) ─────────────────────")
    cm = confusion_matrix(y_true, y_pred, labels=range(len(le.classes_)))
    header = f"{'':10}" + "  ".join(f"{c:>8}" for c in le.classes_)
    print(header)
    for i, row in enumerate(cm):
        print(f"{le.classes_[i]:10}" + "  ".join(f"{v:>8}" for v in row))


if __name__ == "__main__":
    evaluate()
