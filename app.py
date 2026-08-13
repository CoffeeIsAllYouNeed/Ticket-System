import sqlite3
from flask import Flask, request, jsonify
from flask_cors import CORS
from src.predict import Predictor

app = Flask(__name__)
CORS(app)

predictor = Predictor()


def init_db():
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender TEXT,
            subject TEXT,
            body TEXT,
            category TEXT,
            confidence REAL,
            prob_billing REAL,
            prob_technical REAL,
            prob_hr REAL,
            prob_general REAL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()


@app.route("/api/tickets", methods=["GET"])
def get_tickets():
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()
    cursor.execute("SELECT id, sender, subject, body, category, confidence, prob_billing, prob_technical, prob_hr, prob_general, timestamp FROM tickets ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()

    tickets = []
    for r in rows:
        tickets.append({
            "id": r[0],
            "sender": r[1],
            "subject": r[2],
            "body": r[3],
            "category": r[4],
            "confidence": r[5],
            "probabilities": {
                "Billing": r[6],
                "Technical": r[7],
                "HR": r[8],
                "General": r[9]
            },
            "timestamp": r[10]
        })
    return jsonify(tickets)


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
    probas = res["probabilities"]

    # Store in SQLite
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO tickets (sender, subject, body, category, confidence, prob_billing, prob_technical, prob_hr, prob_general)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        sender, subject, body, res["category"], res["confidence"],
        probas.get("Billing", 0.0),
        probas.get("Technical", 0.0),
        probas.get("HR", 0.0),
        probas.get("General", 0.0)
    ))
    conn.commit()
    inserted_id = cursor.lastrowid
    conn.close()

    return jsonify({
        "status": "success",
        "ticket": {
            "id": inserted_id,
            "sender": sender,
            "subject": subject,
            "body": body,
            "category": res["category"],
            "confidence": res["confidence"],
            "probabilities": probas
        }
    }), 201


if __name__ == "__main__":
    init_db()
    print("🚀 Flask API Server running at http://127.0.0.1:5000")
    app.run(debug=True, port=5000)