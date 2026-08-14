import os
import pandas as pd
from hr_data import generate_hr_records

def ingest_and_process():
    # Resolve relative paths dynamically (handles running from root or inside src/)
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    input_path = os.path.join(base_dir, 'data', 'customer_support_tickets.csv')
    output_path = os.path.join(base_dir, 'data', 'dataset.csv')
    
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Source data file not found at: {input_path}")
        
    # 1. Read base raw dataset
    df = pd.read_csv(input_path)
    
    # 2. Apply relabeling mapping
    label_mapping = {
        'Technical issue': 'Technical',
        'Billing inquiry': 'Billing',
        'Refund request': 'Billing',
        'Cancellation request': 'Billing',
        'Product inquiry': 'General'
    }
    
    if 'Ticket Type' in df.columns:
        df['Ticket Type'] = df['Ticket Type'].map(label_mapping).fillna(df['Ticket Type'])
    else:
        raise KeyError("'Ticket Type' column missing in dataset.")
        
    # 3. Determine auto-increment ID for HR records
    try:
        start_id = int(pd.to_numeric(df["Ticket ID"], errors='coerce').max()) + 1
    except Exception:
        start_id = 1000

    # 4. Generate HR DataFrame via module function
    hr_df = generate_hr_records(num_records=50, start_id=start_id)
    
    # 5. Concatenate base dataset and HR dataset
    final_df = pd.concat([df, hr_df], ignore_index=True)
    
    # 6. Save combined output to data/dataset.csv
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    final_df.to_csv(output_path, index=False)
    print(f"[Success] Relabeled dataset and appended HR records. Saved output to: {output_path}")

if __name__ == "__main__":
    ingest_and_process()