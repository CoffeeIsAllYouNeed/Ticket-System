import joblib
from src.config import MODEL_PATH, VECTORIZER_PATH
from src.dataset import clean_text


class Predictor:
    def __init__(self):
        self.model = joblib.load(MODEL_PATH)
        self.vectorizer = joblib.load(VECTORIZER_PATH)

    def predict_one(self, subject: str, body: str) -> dict:
        raw_text = f"{subject} {body}"
        cleaned = clean_text(raw_text)

        vec = self.vectorizer.transform([cleaned])
        pred_category = self.model.predict(vec)[0]
        probas = self.model.predict_proba(vec)[0]

        prob_dict = {cls: float(prob) for cls, prob in zip(self.model.classes_, probas)}
        confidence = float(max(probas))

        return {
            "category": pred_category,
            "confidence": confidence,
            "probabilities": prob_dict
        }