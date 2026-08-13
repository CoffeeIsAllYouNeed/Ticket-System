import re
import pandas as pd
from typing import Tuple


def clean_text(text: str) -> str:
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r"\{product_purchased\}", "product", text)
    text = re.sub(r"http\S+|www\S+ |https\S+", "", text, flags=re.MULTILINE)
    text = re.sub(r"\S+@\S+", "", text)
    text = re.sub(r"[^a-zA-Z\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def map_category(ticket_type: str, subject: str = "") -> str:
    combined = f"{str(ticket_type)} {str(subject)}".lower()
    if any(k in combined for k in ["bill", "refund", "charge", "payment", "invoice", "cancellation", "subscription"]):
        return "Billing"
    elif any(k in combined for k in ["tech", "bug", "error", "setup", "network", "hardware", "issue", "crash", "peripheral", "compatibility"]):
        return "Technical"
    elif any(k in combined for k in ["hr", "payroll", "onboarding", "leave", "benefits", "employee", "salary", "policy", "job"]):
        return "HR"
    return "General"


def load_raw_dataset(filepath: str) -> pd.DataFrame:
    df = pd.read_csv(filepath)
    subject_col = "Ticket Subject" if "Ticket Subject" in df.columns else df.columns[0]
    desc_col = "Ticket Description" if "Ticket Description" in df.columns else df.columns[1]
    type_col = "Ticket Type" if "Ticket Type" in df.columns else df.columns[2]

    df["text"] = df[subject_col].fillna("") + " " + df[desc_col].fillna("")
    df["clean_text"] = df["text"].apply(clean_text)
    df["category"] = df.apply(lambda r: map_category(r[type_col], r[subject_col]), axis=1)
    
    return df[["clean_text", "category"]].dropna()


def create_synthetic_dataset() -> pd.DataFrame:
    data = [
        ("Invoice query", "I was double charged on my monthly subscription credit card statement.", "Billing"),
        ("Overcharge notice", "Why is my bill higher this month than expected?", "Billing"),
        ("Refund request", "I cancelled my account last week but still got billed.", "Billing"),
        ("Payment failed", "My transaction keeps declining during checkout.", "Billing"),
        ("Need tax receipt", "Please send me the official receipt for my last payment.", "Billing"),
        ("Hardware issue", "My computer displays a black screen on boot up.", "Technical"),
        ("Network error", "Unable to connect to the internal VPN server today.", "Technical"),
        ("Software bug", "The app crashes every time I click on export PDF.", "Technical"),
        ("Setup problem", "I need assistance configuring the peripheral display.", "Technical"),
        ("Account access lost", "Password reset link is not arriving in my inbox.", "Technical"),
        ("Leave policy question", "How many paid leave days do I have remaining this year?", "HR"),
        ("Payroll update", "I need to update my direct deposit bank details.", "HR"),
        ("Benefits enrollment", "When does the health insurance coverage kick in?", "HR"),
        ("Onboarding docs", "Where do I upload my background check verification forms?", "HR"),
        ("Performance review", "Who is my assigned HR representative for annual review?", "HR"),
        ("Office hours inquiry", "What time does the main headquarters facility open?", "General"),
        ("Product inquiry", "Are there any discounts available for team licenses?", "General"),
        ("Feedback on service", "Great experience working with customer service team.", "General"),
        ("Contact details", "Can I speak to someone regarding general partnership?", "General"),
        ("Company location", "Where can I find the list of regional office addresses?", "General")
    ]
    return pd.DataFrame(data, columns=["clean_text", "category"])