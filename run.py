from src.predict import Predictor
from src.train import run_training


if __name__ == "__main__":
    print("==========================================")
    print("Starting Model Training Pipeline...")
    print("==========================================")

    # 1. Run model training and export weights
    classifier = run_training()
    print("Training complete! Models saved in /models and /public directories.\n")

    # 2. Sanity-check the trained model
    print("Testing Predictor on sample ticket...")
    predictor = Predictor()
    sample_res = predictor.predict_one(
        "Refund Request",
        "I was double charged on my credit card invoice last month."
    )
    print(f"Predicted Category: {sample_res['category']}")
    print(f"Confidence: {sample_res['confidence'] * 100:.2f}%")
    print(f"Probabilities: {sample_res['probabilities']}")
    print("==========================================")
