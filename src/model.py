from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_recall_fscore_support


class TicketClassifier:
    def __init__(self, max_features=5000, ngram_range=(1, 2), c_param=1.0, seed=42):
        self.vectorizer = TfidfVectorizer(
            max_features=max_features,
            ngram_range=ngram_range,
            sublinear_tf=True
        )
        self.model = LogisticRegression(
            C=c_param,
            class_weight="balanced",
            random_state=seed,
            max_iter=1000
        )

    def fit(self, X, y):
        X_vec = self.vectorizer.fit_transform(X)
        self.model.fit(X_vec, y)

    def evaluate(self, X_test, y_test):
        X_vec = self.vectorizer.transform(X_test)
        preds = self.model.predict(X_vec)
        acc = accuracy_score(y_test, preds)
        p, r, f, _ = precision_recall_fscore_support(y_test, preds, average="weighted")
        return {
            "accuracy": float(acc),
            "precision": float(p),
            "recall": float(r),
            "f1_score": float(f)
        }

    def export_web_weights(self):
        classes = self.model.classes_.tolist()
        feature_names = self.vectorizer.get_feature_names_out().tolist()
        coefs = self.model.coef_.tolist()
        intercepts = self.model.intercept_.tolist()

        return {
            "classes": classes,
            "vocabulary": {word: idx for idx, word in enumerate(feature_names)},
            "coefficients": coefs,
            "intercepts": intercepts,
            "idf": self.vectorizer.idf_.tolist()
        }