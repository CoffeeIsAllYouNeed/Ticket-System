import imaplib
import os
import email
import time
from email.header import decode_header

from dotenv import load_dotenv

from src.db import init_db, insert_ticket
from src.predict import Predictor

load_dotenv()

IMAP_SERVER = "imap.gmail.com"
EMAIL_ACCOUNT = os.getenv("SUPPORT_EMAIL_ACCOUNT", "")
EMAIL_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")

predictor = Predictor()


def process_unread_emails():
    try:
        mail = imaplib.IMAP4_SSL(IMAP_SERVER)
        mail.login(EMAIL_ACCOUNT, EMAIL_PASSWORD)
        mail.select("inbox")

        status, response = mail.search(None, "UNSEEN")
        email_ids = response[0].split()

        if not email_ids:
            mail.logout()
            return

        for e_id in email_ids:
            _, msg_data = mail.fetch(e_id, "(RFC822)")
            for response_part in msg_data:
                if isinstance(response_part, tuple):
                    msg = email.message_from_bytes(response_part[1])

                    subject, encoding = decode_header(msg.get("Subject", ""))[0]
                    if isinstance(subject, bytes):
                        subject = subject.decode(encoding if encoding else "utf-8")

                    sender = msg.get("From", "Unknown Sender")

                    body = ""
                    if msg.is_multipart():
                        for part in msg.walk():
                            if part.get_content_type() == "text/plain":
                                body = part.get_payload(decode=True).decode(errors="ignore")
                                break
                    else:
                        body = msg.get_payload(decode=True).decode(errors="ignore")

                    res = predictor.predict_one(subject, body)
                    insert_ticket(sender, subject, body, res)
                    print(f"Successfully processed and routed email from {sender} to [{res['category']}] queue.")

        mail.logout()
    except Exception as e:
        print(f"Fetch Error: {e}")


if __name__ == "__main__":
    init_db()
    print(f"Listening for incoming emails on {EMAIL_ACCOUNT}...")
    while True:
        process_unread_emails()
        time.sleep(30)
