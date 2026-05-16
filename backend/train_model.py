import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
import joblib

def train_and_save_model():
    print("Loading raw AA/GSTN feature dataset...")
    df = pd.read_csv("training_data.csv")
    
    # Target variable
    y = df['target_score']
    
    # Feature variables (dropping identifiers)
    X = df.drop(columns=['gstin', 'business_name', 'target_score'])
    
    # Identify numerical and categorical features
    numeric_features = ['established_year', 'avg_monthly_balance', 'bounce_rate_percent', 'bureau_vintage_months']
    categorical_features = [
        'gst_compliance', 'utility_punctuality', 'upi_frequency', 
        'digital_presence', 'location_stability', 'monthly_revenue_trend', 'itr_filed_last_year'
    ]
    
    # Create preprocessing pipelines
    numeric_transformer = Pipeline(steps=[
        ('scaler', StandardScaler())
    ])
    
    categorical_transformer = Pipeline(steps=[
        ('onehot', OneHotEncoder(handle_unknown='ignore'))
    ])
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_features),
            ('cat', categorical_transformer, categorical_features)
        ])
    
    # Append classifier to preprocessing pipeline
    # Now we have a full prediction pipeline
    clf = Pipeline(steps=[('preprocessor', preprocessor),
                          ('regressor', RandomForestRegressor(n_estimators=100, random_state=42))])
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training Random Forest Regressor on features...")
    clf.fit(X_train, y_train)
    
    score = clf.score(X_test, y_test)
    print(f"✅ Model trained successfully! R^2 Score on Test Set: {score:.2f}")
    
    # Save the pipeline
    joblib.dump(clf, 'msme_score_model.pkl')
    # Save the explicit feature names for the API to explain importance later
    feature_names = numeric_features + list(clf.named_steps['preprocessor'].named_transformers_['cat'].named_steps['onehot'].get_feature_names_out(categorical_features))
    joblib.dump(feature_names, 'model_features.pkl')
    
    print("💾 Model saved as msme_score_model.pkl")

if __name__ == "__main__":
    train_and_save_model()
