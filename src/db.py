import sqlite3
from pathlib import Path

from src.config import BASE_DIR

DB_PATH = BASE_DIR / "database.db"


def get_connection() -> sqlite3.Connection:
    return sqlite3.connect(DB_PATH)


def init_db() -> None:
    conn = get_connection()
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


def insert_ticket(sender: str, subject: str, body: str, result: dict) -> int:
    """Insert a classified ticket and return the new row id."""
    probas = result["probabilities"]
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO tickets (sender, subject, body, category, confidence, prob_billing, prob_technical, prob_hr, prob_general)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        sender, subject, body, result["category"], result["confidence"],
        probas.get("Billing", 0.0),
        probas.get("Technical", 0.0),
        probas.get("HR", 0.0),
        probas.get("General", 0.0)
    ))
    conn.commit()
    inserted_id = cursor.lastrowid
    conn.close()
    return inserted_id
