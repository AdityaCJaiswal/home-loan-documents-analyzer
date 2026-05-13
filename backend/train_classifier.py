"""
train_classifier.py
====================
Trains an XGBoost multiclass severity classifier on labeled_clauses.csv.

Target classes  : Safe (0) | Low (1) | Medium (2) | High (3)
Feature source  : LegalBERT sentence embeddings of Clause_Text
                  (prefixed with Clause_Type for richer context)
Output artifact : risk_classifier.pkl  (XGBClassifier + LabelEncoder)
"""

import ast
import warnings

import joblib
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.utils.class_weight import compute_sample_weight
from xgboost import XGBClassifier

warnings.filterwarnings("ignore")

# ── Config ────────────────────────────────────────────────────────────────────
DATA_PATH      = "labeled_clauses.csv"
MODEL_OUT      = "risk_classifier.pkl"
EMBED_MODEL    = "nlpaueb/legal-bert-base-uncased"
LABEL_ORDER    = ["Safe", "Low", "Medium", "High"]   # integer 0-3
RANDOM_STATE   = 42
# ─────────────────────────────────────────────────────────────────────────────


def load_and_clean(path: str) -> pd.DataFrame:
    """Load CSV, drop nulls, extract plain text from list-wrapped Clause_Text."""
    print(f"\n[1/5] Loading dataset from '{path}' ...")
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
    print("    Class distribution:")
    print(df["Severity_Label"].value_counts().to_string(header=False))
    return df.reset_index(drop=True)


def encode_labels(df: pd.DataFrame):
    """Encode string labels to integers.

    Uses LABEL_ORDER as the canonical class list, but only keeps classes
    that are actually present in the data so XGBoost doesn't receive
    phantom classes with zero examples.
    """
    present = df["Severity_Label"].unique().tolist()
    # Keep LABEL_ORDER sequence but only include classes that exist
    ordered_present = [c for c in LABEL_ORDER if c in present]
    le = LabelEncoder()
    le.fit(ordered_present)
    y = le.transform(df["Severity_Label"])
    return y, le


def generate_embeddings(texts: list[str]) -> np.ndarray:
    """Generate LegalBERT sentence embeddings with NaN guard."""
    print(f"\n[3/5] Generating LegalBERT embeddings for {len(texts):,} clauses ...")
    print("      (This may take a few minutes on first run — model download included.)")
    encoder = SentenceTransformer(EMBED_MODEL)
    X = encoder.encode(texts, show_progress_bar=True, batch_size=32)
    X = np.nan_to_num(X, nan=0.0, posinf=0.0, neginf=0.0)
    print(f"    [OK] Embedding matrix shape: {X.shape}")
    return X


def build_xgb_model(num_classes: int) -> XGBClassifier:
    return XGBClassifier(
        objective="multi:softprob",
        num_class=num_classes,
        n_estimators=400,
        learning_rate=0.05,
        max_depth=6,
        min_child_weight=3,
        subsample=0.8,
        colsample_bytree=0.8,
        gamma=0.1,
        reg_alpha=0.1,
        reg_lambda=1.0,
        eval_metric="mlogloss",
        random_state=RANDOM_STATE,
        n_jobs=-1,
        tree_method="hist",       # fast CPU histogram method
    )


def cross_validate(clf, X, y, le):
    """5-fold stratified CV — manual loop to support sample_weight in sklearn 1.6+."""
    from sklearn.metrics import f1_score
    print("\n[4/5] Running 5-fold stratified cross-validation ...")
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    fold_scores = []
    for fold, (train_idx, val_idx) in enumerate(skf.split(X, y), 1):
        X_tr, X_val = X[train_idx], X[val_idx]
        y_tr, y_val = y[train_idx], y[val_idx]
        sw_tr = compute_sample_weight("balanced", y_tr)
        fold_clf = build_xgb_model(num_classes=len(le.classes_))
        fold_clf.fit(X_tr, y_tr, sample_weight=sw_tr)
        y_pred = fold_clf.predict(X_val)
        score = f1_score(y_val, y_pred, average="weighted", zero_division=0)
        fold_scores.append(score)
        print(f"      Fold {fold}: weighted F1 = {score:.3f}")
    scores = np.array(fold_scores)
    print(f"    Mean weighted F1     : {scores.mean():.3f}  +/-  {scores.std():.3f}")
    return scores


def train_final_model(clf, X, y):
    """Train on the full dataset with balanced sample weights."""
    print("\n[5/5] Training final XGBoost model on full dataset ...")
    sample_w = compute_sample_weight("balanced", y)
    clf.fit(X, y, sample_weight=sample_w)
    print("    [OK] Training complete.")
    return clf


def evaluate(clf, X, y, le):
    """Print classification report and confusion matrix."""
    y_pred = clf.predict(X)
    print("\n── Training-set Classification Report ──────────────────────────────")
    print(classification_report(y, y_pred, target_names=le.classes_))
    print("── Confusion Matrix (rows=True, cols=Predicted) ─────────────────────")
    cm = confusion_matrix(y, y_pred, labels=range(len(le.classes_)))
    header = f"{'':10}" + "  ".join(f"{c:>8}" for c in le.classes_)
    print(header)
    for i, row in enumerate(cm):
        print(f"{le.classes_[i]:10}" + "  ".join(f"{v:>8}" for v in row))


def save_artifacts(clf, le, path: str):
    """Persist model + label encoder as a single dict."""
    bundle = {"model": clf, "label_encoder": le}
    joblib.dump(bundle, path)
    print(f"\n[DONE] Saved model bundle -> '{path}'")
    print("    Keys: 'model' (XGBClassifier),  'label_encoder' (LabelEncoder)")


# ── Entry point ───────────────────────────────────────────────────────────────
def train_model():
    print("=" * 65)
    print("  Severity Classifier Training  (XGBoost + LegalBERT)")
    print("=" * 65)

    # 1. Load & clean
    df = load_and_clean(DATA_PATH)

    # Split out a holdout test set for evaluate_model.py
    df_train, df_test = train_test_split(df, test_size=0.2, random_state=RANDOM_STATE, stratify=df["Severity_Label"])
    df_test.to_csv("test_clauses.csv", index=False)
    print(f"\n[!] Split data: {len(df_train)} train, {len(df_test)} test (saved to 'test_clauses.csv')")
    
    df = df_train

    # 2. Encode labels
    print("\n[2/5] Encoding labels ...")
    y, le = encode_labels(df)
    print(f"    Label mapping: { {cls: i for i, cls in enumerate(le.classes_)} }")

    # 3. Embed
    X = generate_embeddings(df["input_text"].tolist())

    # 4. Cross-validate
    clf = build_xgb_model(num_classes=len(le.classes_))
    cross_validate(clf, X, y, le)

    # 5. Final training + save
    clf_final = build_xgb_model(num_classes=len(le.classes_))
    train_final_model(clf_final, X, y)
    evaluate(clf_final, X, y, le)
    save_artifacts(clf_final, le, MODEL_OUT)


if __name__ == "__main__":
    train_model()