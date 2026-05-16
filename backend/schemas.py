from pydantic import BaseModel, Field
from typing import Optional

class MSMEBase(BaseModel):
    business_name: str
    established_year: int
    gst_compliance: str
    utility_punctuality: str
    upi_frequency: str
    digital_presence: str
    location_stability: str

    # New fields
    avg_monthly_balance: float
    bounce_rate_percent: float
    itr_filed_last_year: bool
    bureau_vintage_months: int
    monthly_revenue_trend: str

class MSMECreate(MSMEBase):
    gstin: str

class MSMEUpdate(MSMEBase):
    pass

class MSMERecord(MSMEBase):
    gstin: str
    last_updated: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    username: Optional[str] = None
    role: Optional[str] = None

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class User(BaseModel):
    username: str
    role: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    
    class Config:
        from_attributes = True
    
class UserCreate(BaseModel):
    username: str
    password: str

class UserManage(BaseModel):
    username: str
    password: str
    role: str = "viewer"  # admin, viewer, analyst
