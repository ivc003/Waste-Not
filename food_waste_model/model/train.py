import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score, accuracy_score, classification_report
import pickle
import os
import sys


sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from data.my_data import generate_data, load_store_location_data


def prepare_features(df):
    expiry_map = {'produce': 7, 'meat': 5, 'dairy': 14, 
              'grain': 180, 'sauce/condiments': 30, 
              'beverages': 180, 'canned': 365}
    max_days = df['store_categories'].map(expiry_map)

    le = LabelEncoder()
    df['store_size_encoded'] = le.fit_transform(df['store_sizes'])
    category_OHE = pd.get_dummies(df['store_categories'], prefix='cat')
    product_OHE = pd.get_dummies(df['store_products'], prefix='prod')

    feature_cols = ['store_size_encoded', 'days_to_expiry', 
                'quantity_available', 'original_prices',
                'store_lats', 'store_lngs',
                'store_aggressiveness', 'ward_price_factor']
    
    df = pd.concat([df, category_OHE, product_OHE], axis=1)
    cat_cols = [col for col in df.columns if col.startswith('cat_')]
    prod_cols = [col for col in df.columns if col.startswith('prod_')]
    feature_cols = feature_cols + cat_cols + prod_cols
    
    Y_price = df['discounted_prices']
    Y_availability = df['is_available']

    discount_percentage = 1 - (df['discounted_prices'] / df['original_prices'])
    expiry_urgency = 1 - (df['days_to_expiry'] / max_days)
    Y_match = (0.6 * discount_percentage + 0.4 * expiry_urgency) * 100

    return df[feature_cols], Y_price, Y_availability, Y_match



def train_models(df):
    X, y_price, y_availability, y_match = prepare_features(df)
    X_train, X_test, y_train, y_test = train_test_split(X, y_price, test_size=0.2, random_state=42)
    _, _, y_avail_train, y_avail_test = train_test_split(X, y_availability, test_size=0.2, random_state=42)
    _, _, y_match_train, y_match_test = train_test_split(X, y_match, test_size=0.2, random_state=42)

    dtrain_price = xgb.DMatrix(X_train, label=y_train)
    dtest_price = xgb.DMatrix(X_test, label=y_test)

    dtrain_availability = xgb.DMatrix(X_train, label=y_avail_train)
    dtest_availability = xgb.DMatrix(X_test, label=y_avail_test)

    dtrain_match = xgb.DMatrix(X_train, label=y_match_train)
    dtest_match = xgb.DMatrix(X_test, label=y_match_test)


    params_price = {
    'objective': 'reg:squarederror',  # for regression
    'max_depth': 6,                    # tree depth
    'learning_rate': 0.1,             # how fast it learns
    'subsample': 0.8,                 # % of data per tree
    'colsample_bytree': 0.8,          # % of features per tree
}
    params_avail = {
    'objective': 'binary:logistic',  # for regression
    'max_depth': 6,                    # tree depth
    'learning_rate': 0.1,             # how fast it learns
    'subsample': 0.8,                 # % of data per tree
    'colsample_bytree': 0.8,          # % of features per tree
}
    
    params_match = {
    'objective': 'reg:squarederror',  # for regression
    'max_depth': 6,                    # tree depth
    'learning_rate': 0.1,             # how fast it learns
    'subsample': 0.8,                 # % of data per tree
    'colsample_bytree': 0.8,          # % of features per tree
}
    model_price = xgb.train(params_price, dtrain_price, num_boost_round=100)
    model_avail = xgb.train(params_avail, dtrain_availability, num_boost_round=100)
    model_match = xgb.train(params_match, dtrain_match, num_boost_round=100)
    
    cv_results = xgb.cv(
    params_price,
    dtrain_price,
    num_boost_round=100,
    nfold=5,
    metrics='rmse',
    early_stopping_rounds=10,
    seed=42
)
    
    cv_results_avail = xgb.cv(
        params_avail,
        dtrain_availability,
        num_boost_round=100,
        nfold=5,
        metrics='error',
        early_stopping_rounds=10,
        seed=42
    )
    print(f"Availability CV Error: {cv_results_avail['test-error-mean'].min():.4f}")

    cv_results_match = xgb.cv(
        params_match,
        dtrain_match,
        num_boost_round=100,
        nfold=5,
        metrics='rmse',
        early_stopping_rounds=10,
        seed=42
    )
    print(f"Match Score CV RMSE: {cv_results_match['test-rmse-mean'].min():.4f}")
    
    print(f"Price CV RMSE: {cv_results['test-rmse-mean'].min():.4f}")
    # evaluate price model
    price_preds = model_price.predict(dtest_price)
    print(f"\n--- Price Model ---")
    print(f"MAE: ${mean_absolute_error(y_test, price_preds):.4f}")
    print(f"R2 Score: {r2_score(y_test, price_preds):.4f}")

    # evaluate availability model
    avail_preds = (model_avail.predict(dtest_availability) > 0.5).astype(int)
    print(f"\n--- Availability Model ---")
    print(f"Accuracy: {accuracy_score(y_avail_test, avail_preds):.4f}")
    print(classification_report(y_avail_test, avail_preds))

    # evaluate match score model
    match_preds = model_match.predict(dtest_match)
    print(f"\n--- Match Score Model ---")
    print(f"MAE: {mean_absolute_error(y_match_test, match_preds):.4f}")
    print(f"R2 Score: {r2_score(y_match_test, match_preds):.4f}")
    return model_price, model_avail, model_match




if __name__ == '__main__':
    print("Generating data...")
    df = generate_data()
    print("Training models...")
    model_price, model_avail, model_match = train_models(df)
    print("Models trained successfully!")
    
    os.makedirs('../models_saved', exist_ok=True)
    model_price.save_model('../models_saved/price_model.json')
    model_avail.save_model('../models_saved/availability_model.json')
    model_match.save_model('../models_saved/match_model.json')
    print("Models saved!")