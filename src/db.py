import json
from datetime import datetime, timezone

from src.config import BASE_DIR

DB_PATH = BASE_DIR / "tickets_db.json"


def init_db() -> None:
    if not DB_PATH.exists():
        DB_PATH.write_text(json.dumps([]))


def _read_all() -> list:
    if not DB_PATH.exists():
        return []
    with open(DB_PATH, "r") as f:
        return json.load(f)


def _write_all(tickets: list) -> None:
    with open(DB_PATH, "w") as f:
        json.dump(tickets, f, indent=2)


def get_all_tickets() -> list:
    """Return all tickets, newest first."""
    tickets = _read_all()
    return sorted(tickets, key=lambda t: t["id"], reverse=True)


def insert_ticket(sender: str, subject: str, body: str, result: dict) -> int:
    """Insert a classified ticket and return the new ticket id."""
    tickets = _read_all()
    new_id = (max((t["id"] for t in tickets), default=0)) + 1
    probas = result["probabilities"]

    ticket = {
        "id": new_id,
        "sender": sender,
        "subject": subject,
        "body": body,
        "category": result["category"],
        "confidence": result["confidence"],
        "probabilities": {
            "Billing": probas.get("Billing", 0.0),
            "Technical": probas.get("Technical", 0.0),
            "HR": probas.get("HR", 0.0),
            "General": probas.get("General", 0.0),
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    tickets.append(ticket)
    _write_all(tickets)
    return new_id