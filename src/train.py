import json
import joblib
from sklearn.model_selection import train_test_split
from src.config import (
    DATA_PATH, MODEL_PATH, VECTORIZER_PATH, METRICS_PATH, 
    WEB_MODEL_PATH, MODEL_DIR, PUBLIC_DIR, TEST_SIZE, SEED,
    TFIDF_MAX_FEATURES, TFIDF_NGRAM_RANGE, C_PARAM
)
from src.dataset import load_raw_dataset, create_synthetic_dataset
from src.model import TicketClassifier


def run_training() -> TicketClassifier:
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)

    if DATA_PATH.exists():
        df = load_raw_dataset(str(DATA_PATH))
    else:
        df = create_synthetic_dataset()

    X = df["clean_text"].tolist()
    y = df["category"].tolist()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=SEED, stratify=y
    )

    classifier = TicketClassifier(
        max_features=TFIDF_MAX_FEATURES,
        ngram_range=TFIDF_NGRAM_RANGE,
        c_param=C_PARAM,
        seed=SEED
    )
    classifier.fit(X_train, y_train)

    metrics = classifier.evaluate(X_test, y_test)

    joblib.dump(classifier.model, MODEL_PATH)
    joblib.dump(classifier.vectorizer, VECTORIZER_PATH)

    with open(METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=2)

    web_weights = classifier.export_web_weights()
    with open(WEB_MODEL_PATH, "w") as f:
        json.dump(web_weights, f)

    return classifier