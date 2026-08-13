import joblib
from typing import List, Dict
from src.config import MODEL_PATH, VECTORIZER_PATH
from src.dataset import clean_text


class Predictor:
    def __init__(self):
        self.model = joblib.load(MODEL_PATH)
        self.vectorizer = joblib.load(VECTORIZER_PATH)

    def predict_one(self, subject: str, body: str) -> Dict:
        combined = f"{subject} {body}"
        cleaned = clean_text(combined)
        vec = self.vectorizer.transform([cleaned])
        pred = self.model.predict(vec)[0]
        probas = self.model.predict_proba(vec)[0]
        confidence = float(max(probas))
        
        prob_dict = {
            cls: float(prob)
            for cls, prob in zip(self.model.classes_, probas)
        }
        
        return {
            "subject": subject,
            "body": body,
            "category": pred,
            "confidence": confidence,
            "probabilities": prob_dict
        }

    def predict_batch(self, tickets: List[Dict[str, str]]) -> List[Dict]:
        return [self.predict_one(t.get("subject", ""), t.get("body", "")) for t in tickets]