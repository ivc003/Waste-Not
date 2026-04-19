import numpy as np
import pandas as pd
import xgboost as xgb
from geopy.distance import geodesic
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from data.my_data import (load_store_location_data, PRODUCTS, 
                           PRODUCT_CATEGORY_MAP, BASE_PRICES,
                           get_store_aggressiveness, get_ward_factor)

def load_models():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    models_dir = os.path.join(base_dir, '..', 'models_saved')
    model_price = xgb.Booster()
    model_price.load_model(os.path.join(models_dir, 'price_model.json'))
    model_avail = xgb.Booster()
    model_avail.load_model(os.path.join(models_dir, 'availability_model.json'))
    model_match = xgb.Booster()
    model_match.load_model(os.path.join(models_dir, 'match_model.json'))
    return model_price, model_avail, model_match

def filter_stores(restaurant_lat, restaurant_lng, radius_miles):
    stores = load_store_location_data()
    stores['distance_miles'] = [
        geodesic((restaurant_lat, restaurant_lng), (store_lat, store_lng)).miles
        for store_lat, store_lng in zip(stores['lat'], stores['lng'])
    ]
    nearby_stores = stores[stores['distance_miles'] <= radius_miles]
    return nearby_stores

def build_features(store_row, product_name, days_to_expiry=None, quantity_available=None):
    category = PRODUCT_CATEGORY_MAP[product_name]
    original_price = BASE_PRICES[product_name]

    expiry_map = {
        'produce': 7, 'meat': 5, 'dairy': 14,
        'grain': 180, 'sauce/condiments': 30,
        'beverages': 180, 'canned': 365
    }
    max_days = expiry_map[category]

    if days_to_expiry is None:
        days_to_expiry = np.random.randint(1, max_days)
    if quantity_available is None:
        quantity_available = np.random.randint(1, 500)

    size_encoding = {'small': 2, 'medium': 1, 'large': 0}
    store_sizes = ['small', 'medium', 'large']
    store_size = np.random.choice(store_sizes, p=[0.3, 0.5, 0.2])
    store_size_encoded = size_encoding[store_size]

    all_categories = ['beverages', 'canned', 'dairy', 'grain', 
                      'meat', 'produce', 'sauce/condiments']
    all_products = sorted(PRODUCTS)

    row = {
        'store_size_encoded': store_size_encoded,
        'days_to_expiry': days_to_expiry,
        'quantity_available': quantity_available,
        'original_prices': original_price,
        'store_lats': store_row['lat'],
        'store_lngs': store_row['lng'],
        'store_aggressiveness': get_store_aggressiveness(store_row['STORENAME']),
        'ward_price_factor': get_ward_factor(store_row['WARD']),
    }

    for cat in all_categories:
        row[f'cat_{cat}'] = 1 if cat == category else 0

    for prod in all_products:
        row[f'prod_{prod}'] = 1 if prod == product_name else 0

    return pd.DataFrame([row])

def predict(restaurant_lat, restaurant_lng, radius_miles, product_name):
    if product_name not in PRODUCTS:
        print(f"Product '{product_name}' not found. Available: {PRODUCTS}")
        return None

    nearby_stores = filter_stores(restaurant_lat, restaurant_lng, radius_miles)

    if len(nearby_stores) == 0:
        print(f"No stores found within {radius_miles} miles!")
        return None

    model_price, model_avail, model_match = load_models()

    results = []
    for _, store_row in nearby_stores.iterrows():
        features = build_features(store_row, product_name)
        dmatrix = xgb.DMatrix(features)

        predicted_price = model_price.predict(dmatrix)[0]
        availability_prob = model_avail.predict(dmatrix)[0]
        match_score = model_match.predict(dmatrix)[0]

        results.append({
            'store_name': store_row['STORENAME'],
            'address': store_row['ADDRESS'],
            'ward': store_row['WARD'],
            'distance_miles': round(store_row['distance_miles'], 2),
            'predicted_price': round(float(predicted_price), 2),
            'availability_probability': round(float(availability_prob) * 100, 1),
            'match_score': round(float(match_score), 1)
        })

    results_df = pd.DataFrame(results)
    results_df = results_df.sort_values('match_score', ascending=False).reset_index(drop=True)
    results_df.index += 1

    return results_df

if __name__ == '__main__':
    restaurant_lat = 38.8977
    restaurant_lng = -77.0365
    radius_miles = 2
    product_name = 'ground beef'

    print(f"\nSearching for '{product_name}' within {radius_miles} miles...\n")
    results = predict(restaurant_lat, restaurant_lng, radius_miles, product_name)

    if results is not None:
        print(results.to_string())

