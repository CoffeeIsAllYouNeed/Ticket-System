from flask import Flask, request, jsonify
from flask_cors import CORS

from src.db import get_all_tickets, init_db, insert_ticket
from src.predict import Predictor

app = Flask(__name__)
CORS(app)

predictor = Predictor()


@app.route("/api/tickets", methods=["GET"])
def get_tickets():
    return jsonify(get_all_tickets())


@app.route("/api/tickets/incoming", methods=["POST"])
def handle_incoming_ticket():
    data = request.get_json() or {}
    sender = data.get("sender", "anonymous@example.com")
    subject = data.get("subject", "")
    body = data.get("body", "")

    if not subject and not body:
        return jsonify({"error": "Subject or body is required"}), 400

    # Classify ticket with ML pipeline
    res = predictor.predict_one(subject, body)

    # Store in tickets_db.json
    inserted_id = insert_ticket(sender, subject, body, res)

    return jsonify({
        "status": "success",
        "ticket": {
            "id": inserted_id,
            "sender": sender,
            "subject": subject,
            "body": body,
            "category": res["category"],
            "confidence": res["confidence"],
            "probabilities": res["probabilities"]
        }
    }), 201


if __name__ == "__main__":
    init_db()
    print("Flask API Server running at http://127.0.0.1:5000")
    app.run(debug=True, port=5000)