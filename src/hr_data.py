import random
import pandas as pd

def generate_hr_records(num_records=50, start_id=1000):
    first_names = ["Alex", "Jordan", "Taylor", "Morgan", "Sam", "Chris", "Pat", "Riley", "Jamie", "Casey"]
    last_names = ["Rivera", "Chen", "Kim", "Patel", "Smith", "Johnson", "Davis", "Miller", "Wilson", "Taylor"]
    genders = ["Female", "Male", "Other"]
    
    hr_subjects = [
        "Payroll deduction discrepancy",
        "Health insurance benefits enrollment",
        "Paid time off / Leave approval request",
        "Remote work policy clarification",
        "Onboarding documents assistance",
        "Performance evaluation feedback"
    ]
    
    hr_descriptions = [
        "I noticed an unexpected deduction on my recent pay stub and need clarification.",
        "Could you guide me through adding a dependent to my medical plan?",
        "Submitting formal request for annual leave from next month.",
        "Need clarification regarding company policy on equipment reimbursement.",
        "Seeking assistance with signing employment verification forms."
    ]
    
    statuses = ["Open", "Pending Customer Response", "Closed", "Resolved"]
    priorities = ["Low", "Medium", "High", "Critical"]
    channels = ["Email", "Portal", "Chat"]

    records = []
    for i in range(num_records):
        f_name = random.choice(first_names)
        l_name = random.choice(last_names)
        name = f"{f_name} {l_name}"
        email = f"{f_name.lower()}.{l_name.lower()}@company.com"
        
        records.append({
            "Ticket ID": start_id + i,
            "Customer Name": name,
            "Customer Email": email,
            "Customer Age": random.randint(22, 60),
            "Customer Gender": random.choice(genders),
            "Product Purchased": "Internal HR Portal",
            "Date of Purchase": "2022-01-10",
            "Ticket Type": "HR",
            "Ticket Subject": random.choice(hr_subjects),
            "Ticket Description": random.choice(hr_descriptions),
            "Ticket Status": random.choice(statuses),
            "Resolution": "Resolved by HR team" if random.choice([True, False]) else None,
            "Ticket Priority": random.choice(priorities),
            "Ticket Channel": random.choice(channels),
            "First Response Time": "2023-06-01 09:30:00",
            "Time to Resolution": "2023-06-02 11:15:00",
            "Customer Satisfaction Rating": random.choice([3, 4, 5, None])
        })
    return pd.DataFrame(records)