from sqlalchemy import Boolean, Column, Float, Integer, String
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    hashed_password = Column(String(100))
    role = Column(String(20))  # "admin", "analyst", "viewer"
    full_name = Column(String(100), nullable=True)
    email = Column(String(100), nullable=True)

class MSMERecord(Base):
    __tablename__ = "msme_records"

    # Identity
    gstin = Column(String(15), primary_key=True, index=True)
    business_name = Column(String(100))
    established_year = Column(Integer)
    last_updated = Column(String(50))

    # Existing Categorical Signals
    gst_compliance = Column(String(50)) # on_time, occasionally_late, frequently_late
    utility_punctuality = Column(String(50)) # on_time, sometimes_late, often_late
    upi_frequency = Column(String(50)) # high, medium, low
    digital_presence = Column(String(50)) # strong, basic, none
    location_stability = Column(String(50)) # stable, changed_once, unstable

    # NEW REAL-WORLD FINANCIAL SIGNALS
    avg_monthly_balance = Column(Float) # proxy for cash flow
    bounce_rate_percent = Column(Float) # percentage of cheques/NACHs that bounce
    itr_filed_last_year = Column(Boolean) # indicator of tax compliance
    bureau_vintage_months = Column(Integer) # how long they have had a credit footprint
    monthly_revenue_trend = Column(String(50)) # growing, stable, declining
