from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "models"
PUBLIC_DIR = BASE_DIR / "public"

DATA_PATH = DATA_DIR / "tickets.csv"
MODEL_PATH = MODEL_DIR / "classifier.joblib"
VECTORIZER_PATH = MODEL_DIR / "vectorizer.joblib"
METRICS_PATH = MODEL_DIR / "metrics.json"
WEB_MODEL_PATH = PUBLIC_DIR / "model_weights.json"

CATEGORIES = ["Billing", "Technical", "HR", "General"]

SEED = 42
TEST_SIZE = 0.2
TFIDF_MAX_FEATURES = 1500
TFIDF_NGRAM_RANGE = (1, 2)
C_PARAM = 1.0
MAX_ITER = 1000