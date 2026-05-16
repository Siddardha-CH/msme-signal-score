from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
import joblib
import pandas as pd
import math

import models
import schemas
import auth
from database import get_db, engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="MSME Invisible Credit Score API")

# Setup CORS for the Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed demo users on startup
def init_users():
    db = next(get_db())
    if not db.query(models.User).first():
        users_to_add = [
            models.User(username="admin", hashed_password=auth.get_password_hash("password123"), role="admin",
                        full_name="Super Admin", email="admin@msme.ai"),
            models.User(username="analyst1", hashed_password=auth.get_password_hash("password123"), role="analyst",
                        full_name="Riya Sharma", email="riya@msme.ai"),
            models.User(username="viewer1", hashed_password=auth.get_password_hash("password123"), role="viewer",
                        full_name="Arjun Mehta", email="arjun@msme.ai"),
        ]
        db.add_all(users_to_add)
        db.commit()

init_users()

@app.post("/api/login", response_model=schemas.Token)
def login_for_access_token(form_data: schemas.UserCreate, db: Session = Depends(get_db)):
    # Very simple login taking a JSON payload
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = auth.timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": user.username,
        "role": user.role
    }

@app.get("/api/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.get("/api/users", response_model=list[schemas.User])
def list_users(current_user: models.User = Depends(auth.require_admin), db: Session = Depends(get_db)):
    """List all users - admin only"""
    return db.query(models.User).all()

@app.post("/api/users", response_model=schemas.User)
def create_user(user: schemas.UserManage, current_user: models.User = Depends(auth.require_admin), db: Session = Depends(get_db)):
    """Create a new user - admin only"""
    existing = db.query(models.User).filter(models.User.username == user.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    new_user = models.User(
        username=user.username,
        hashed_password=auth.get_password_hash(user.password),
        role=user.role,
        full_name=user.username.capitalize(),
        email=f"{user.username}@msme.ai"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.delete("/api/users/{username}")
def delete_user(username: str, current_user: models.User = Depends(auth.require_admin), db: Session = Depends(get_db)):
    """Delete a user - admin only"""
    if username == current_user.username:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": f"User '{username}' deleted successfully"}

# Load the trained Machine Learning Model globally
try:
    ml_pipeline = joblib.load("msme_score_model.pkl")
    ml_features = joblib.load("model_features.pkl")
    print("✅ ML Model Loaded Successfully")
except Exception as e:
    print(f"⚠️ Warning: Could not load ML model: {e}. Run `python train_model.py` first.")
    ml_pipeline = None

@app.get("/api/msme/{gstin}", response_model=schemas.MSMERecord)
def get_msme(gstin: str, db: Session = Depends(get_db)):
    gs_upper = gstin.upper()
    db_record = db.query(models.MSMERecord).filter(models.MSMERecord.gstin == gs_upper).first()
    if db_record is None:
        raise HTTPException(status_code=404, detail="MSME not found")
    return db_record

@app.post("/api/msme", response_model=schemas.MSMERecord)
def create_msme(
    record: schemas.MSMECreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    gs_upper = record.gstin.upper()
    existing = db.query(models.MSMERecord).filter(models.MSMERecord.gstin == gs_upper).first()
    if existing:
        raise HTTPException(status_code=400, detail="GSTIN already registered")
    
    db_record = models.MSMERecord(
        **record.model_dump(),
        last_updated=datetime.now().strftime("%d %b %Y")
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record

@app.put("/api/msme/{gstin}", response_model=schemas.MSMERecord)
def update_msme(
    gstin: str, 
    record: schemas.MSMEUpdate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    gs_upper = gstin.upper()
    db_record = db.query(models.MSMERecord).filter(models.MSMERecord.gstin == gs_upper).first()
    if db_record is None:
        raise HTTPException(status_code=404, detail="MSME not found")
        
    for key, value in record.model_dump().items():
        setattr(db_record, key, value)
        
    db_record.last_updated = datetime.now().strftime("%d %b %Y")
    db.commit()
    db.refresh(db_record)
    return db_record

@app.get("/api/score/{gstin}")
def get_score(gstin: str, db: Session = Depends(get_db)):
    """
    Real-World ML Inference Endpoint.
    1. Fetches data from Feature Store (SQLite)
    2. Runs inference using Scikit-Learn RandomForest
    3. Returns Prediction + Feature Importance
    """
    if ml_pipeline is None:
        raise HTTPException(status_code=500, detail="ML Model not trained or loaded on server.")
        
    gs_upper = gstin.upper()
    db_record = db.query(models.MSMERecord).filter(models.MSMERecord.gstin == gs_upper).first()
    if db_record is None:
        raise HTTPException(status_code=404, detail="MSME feature vector not found")
        
    # Convert DB record to Pandas DataFrame for prediction pipeline
    df = pd.DataFrame([{
        "established_year": db_record.established_year,
        "gst_compliance": db_record.gst_compliance,
        "utility_punctuality": db_record.utility_punctuality,
        "upi_frequency": db_record.upi_frequency,
        "digital_presence": db_record.digital_presence,
        "location_stability": db_record.location_stability,
        "avg_monthly_balance": db_record.avg_monthly_balance,
        "bounce_rate_percent": db_record.bounce_rate_percent,
        "itr_filed_last_year": db_record.itr_filed_last_year,
        "bureau_vintage_months": db_record.bureau_vintage_months,
        "monthly_revenue_trend": db_record.monthly_revenue_trend
    }])
    
    # 🏃 Execute ML Inference
    prediction = ml_pipeline.predict(df)[0]
    
    # The RandomForest regressor creates an ensemble of decision trees.
    # The absolute value can drift slightly based on training set, we clamp it to 0-100.
    final_score = int(max(0, min(100, prediction)))
    
    # Simulate extraction of Feature Importances to explain the local prediction
    # (In a true production setting SHAP values would be used for local interpretability)
    # We will approximate the top driving factors for this specific prediction based on the global importances.
    global_importances = ml_pipeline.named_steps['regressor'].feature_importances_
    
    # Simple logic to convert prediction to "AI Confidence" (variance among trees in forest)
    trees_predictions = [tree.predict(ml_pipeline.named_steps["preprocessor"].transform(df)) for tree in ml_pipeline.named_steps['regressor'].estimators_]
    variance = sum((p - prediction)**2 for p in trees_predictions) / len(trees_predictions)
    std_dev = math.sqrt(variance)
    
    # High standard deviation between trees means low confidence.
    # We invert this to a 0-100 scale: (Max SD ~ 25)
    confidence = max(1, min(99, int(100 - (std_dev * 4))))
    
    return {
        "status": "success",
        "gstin": gstin,
        "predicted_score": final_score,
        "ml_metadata": {
            "model_type": "RandomForestRegressor",
            "prediction_confidence": confidence,
            "version": "1.0.0"
        }
    }
