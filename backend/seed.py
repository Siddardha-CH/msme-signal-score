from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
import models
import random
from datetime import datetime
import pandas as pd

# Recreate tables
Base.metadata.create_all(bind=engine)

def generate_random_gstin():
    states = ["29", "27", "07", "33", "36", "19", "24", "22", "18", "10"]
    state = random.choice(states)
    pan = "".join(random.choices("ABCDEFGHIJKLMNOPQRSTUVWXYZ", k=5)) + \
          "".join(random.choices("0123456789", k=4)) + \
          random.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
    return f"{state}{pan}1Z{random.choice('123456789')}"

def generate_realistic_data(num_records=500):
    db = SessionLocal()
    
    # First delete existing
    db.query(models.MSMERecord).delete()

    records = []
    
    # Generate ~500 realistic records.
    # We will engineer features somewhat correlated to real life.
    # E.g., if GST compliance is good, bank balance is often higher, bounces are lower.
    
    for _ in range(num_records):
        established_year = random.randint(2010, 2023)
        age = 2026 - established_year
        
        # Base quality of the business (hidden variable to generate realistic correlations)
        # 0 = poor, 1 = average, 2 = excellent
        quality = random.choices([0, 1, 2], weights=[0.2, 0.5, 0.3])[0]
        
        if quality == 2:
            gst = random.choices(["on_time", "occasionally_late"], weights=[0.9, 0.1])[0]
            util = random.choices(["on_time", "sometimes_late"], weights=[0.95, 0.05])[0]
            upi = random.choices(["high", "medium"], weights=[0.8, 0.2])[0]
            avg_bal = random.uniform(500000, 5000000)
            bounce = random.uniform(0.0, 1.5)
            itr = True
            vintage = random.randint(min(age*12, 60), age*12 + 12) if age > 1 else random.randint(6, 24)
            rev_trend = random.choices(["growing", "stable"], weights=[0.7, 0.3])[0]
        elif quality == 1:
            gst = random.choices(["on_time", "occasionally_late", "frequently_late"], weights=[0.3, 0.6, 0.1])[0]
            util = random.choices(["on_time", "sometimes_late", "often_late"], weights=[0.4, 0.5, 0.1])[0]
            upi = random.choices(["high", "medium", "low"], weights=[0.2, 0.6, 0.2])[0]
            avg_bal = random.uniform(50000, 700000)
            bounce = random.uniform(1.0, 5.0)
            itr = random.choices([True, False], weights=[0.8, 0.2])[0]
            vintage = random.randint(12, age*12) if age > 1 else random.randint(0, 12)
            rev_trend = random.choices(["growing", "stable", "declining"], weights=[0.2, 0.6, 0.2])[0]
        else: # poor
            gst = random.choices(["occasionally_late", "frequently_late"], weights=[0.2, 0.8])[0]
            util = random.choices(["sometimes_late", "often_late"], weights=[0.3, 0.7])[0]
            upi = random.choices(["medium", "low"], [0.2, 0.8])[0]
            avg_bal = random.uniform(5000, 80000)
            bounce = random.uniform(4.0, 15.0)
            itr = random.choices([True, False], weights=[0.3, 0.7])[0]
            vintage = random.randint(0, 24)
            rev_trend = random.choices(["stable", "declining"], weights=[0.3, 0.7])[0]
            
        digital_presence = random.choice(["strong", "basic", "none"])
        location_stability = random.choice(["stable", "changed_once", "unstable"])
            
        record = models.MSMERecord(
            gstin=generate_random_gstin(),
            business_name=f"Business {random.randint(1000, 9999)} Works",
            established_year=established_year,
            last_updated=datetime.now().strftime("%d %b %Y"),
            gst_compliance=gst,
            utility_punctuality=util,
            upi_frequency=upi,
            digital_presence=digital_presence,
            location_stability=location_stability,
            avg_monthly_balance=round(avg_bal, 2),
            bounce_rate_percent=round(bounce, 2),
            itr_filed_last_year=itr,
            bureau_vintage_months=vintage,
            monthly_revenue_trend=rev_trend
        )
        db.add(record)
        records.append({
            "gstin": record.gstin,
            "business_name": record.business_name,
            "established_year": record.established_year,
            "gst_compliance": record.gst_compliance,
            "utility_punctuality": record.utility_punctuality,
            "upi_frequency": record.upi_frequency,
            "digital_presence": record.digital_presence,
            "location_stability": record.location_stability,
            "avg_monthly_balance": record.avg_monthly_balance,
            "bounce_rate_percent": record.bounce_rate_percent,
            "itr_filed_last_year": record.itr_filed_last_year,
            "bureau_vintage_months": record.bureau_vintage_months,
            "monthly_revenue_trend": record.monthly_revenue_trend,
            # Generate a "target" score (0-100) based on the hidden quality for the ML model to learn from later
            "target_score": calculate_target_score(quality, record)
        })
        
    db.commit()
    db.close()
    
    # Dump to a CSV for the ML model to train on.
    df = pd.DataFrame(records)
    df.to_csv("training_data.csv", index=False)
    print(f"✅ Generated {num_records} highly realistic MSME records and saved to msme.db and training_data.csv")

def calculate_target_score(quality, r):
    # This is a synthetic target generation so the ML model has something to learn
    # A real fintech would have historical defaults here instead of a "score".
    # For this app, we predict the score.
    base = 80 if quality == 2 else (60 if quality == 1 else 30)
    
    # perturb based on metrics
    base += (r.avg_monthly_balance / 100000) * 2 # max +~10
    base -= r.bounce_rate_percent * 2.5 # max -~35
    if r.itr_filed_last_year: base += 5
    if r.monthly_revenue_trend == "growing": base += 5
    elif r.monthly_revenue_trend == "declining": base -= 10
    
    if r.gst_compliance == "on_time": base += 5
    if r.gst_compliance == "frequently_late": base -= 10
    
    # Cap between 10 and 99
    val = int(max(10, min(99, base + random.uniform(-3, 3))))
    return val

if __name__ == "__main__":
    print("Seeding database with realistic data...")
    generate_realistic_data()
