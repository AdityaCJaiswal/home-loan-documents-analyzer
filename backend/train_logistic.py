import ast
import warnings
import joblib
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.linear_model import LogisticRegression

warnings.filterwarnings("ignore")

DATA_PATH      = "labeled_clauses.csv"
MODEL_OUT      = "risk_classifier2.pkl"
EMBED_MODEL    = "nlpaueb/legal-bert-base-uncased"
LABEL_ORDER    = ["Safe", "Low", "Medium", "High"]
RANDOM_STATE   = 42

def load_and_clean(path: str) -> pd.DataFrame:
    print(f"\n[1/4] Loading dataset from '{path}' ...")
    df = pd.read_csv(path)

    df = df.dropna(subset=["Clause_Text", "Severity_Label"]).copy()

    def extract_text(raw):
        try:
            items = ast.literal_eval(str(raw))
            if isinstance(items, list):
                return " ".join(str(i) for i in items)
        except Exception:
            pass
        return str(raw)

    df["clean_text"] = df["Clause_Text"].apply(extract_text)
    df["input_text"] = df["Clause_Type"].fillna("Unknown") + " [SEP] " + df["clean_text"]

    df["Severity_Label"] = df["Severity_Label"].str.strip().str.capitalize()
    df = df[df["Severity_Label"].isin(LABEL_ORDER)]
    df = df[df["clean_text"].str.len() > 20].drop_duplicates(subset=["clean_text"])

    return df.reset_index(drop=True)

def encode_labels(df: pd.DataFrame):
    present = df["Severity_Label"].unique().tolist()
    ordered_present = [c for c in LABEL_ORDER if c in present]
    le = LabelEncoder()
    le.fit(ordered_present)
    y = le.transform(df["Severity_Label"])
    return y, le

def generate_embeddings(texts: list[str]) -> np.ndarray:
    print(f"\n[3/4] Generating LegalBERT embeddings for {len(texts)} clauses ...")
    encoder = SentenceTransformer(EMBED_MODEL)
    X = encoder.encode(texts, show_progress_bar=True, batch_size=32)
    X = np.nan_to_num(X, nan=0.0, posinf=0.0, neginf=0.0)
    return X

def build_logistic_model() -> LogisticRegression:
    return LogisticRegression(
        max_iter=1000,
        random_state=RANDOM_STATE,
        class_weight="balanced",
        multi_class="multinomial",
        n_jobs=-1
    )

def train_model():
    print("=" * 65)
    print("  Severity Classifier Training  (Logistic Regression)")
    print("=" * 65)

    df = load_and_clean(DATA_PATH)
    
    # Train test split
    df_train, df_test = train_test_split(df, test_size=0.2, random_state=RANDOM_STATE, stratify=df["Severity_Label"])
    df_test.to_csv("test_clauses2.csv", index=False)
    print(f"    Split data: {len(df_train)} train, {len(df_test)} test (saved test to 'test_clauses2.csv')")

    print("\n[2/4] Encoding labels ...")
    y, le = encode_labels(df_train)

    X = generate_embeddings(df_train["input_text"].tolist())

    print("\n[4/4] Training Logistic Regression model ...")
    clf = build_logistic_model()
    clf.fit(X, y)

    y_pred = clf.predict(X)
    print("\n── Training-set Classification Report ──────────────────────────────")
    print(classification_report(y, y_pred, target_names=le.classes_))

    bundle = {"model": clf, "label_encoder": le}
    joblib.dump(bundle, MODEL_OUT)
    print(f"\n[DONE] Saved model bundle -> '{MODEL_OUT}'")

if __name__ == "__main__":
    train_model()
