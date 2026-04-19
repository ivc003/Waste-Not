import numpy as np
import pandas as pd
from pyproj import Transformer
import os

# ── constants ──────────────────────────────────────────────────────────────────
PRODUCTS = [
    'cucumber', 'carrot', 'onion', 'lettuce', 'green pepper',
    'chicken breast', 'chicken drumstick', 'ground beef', 'beef patty', 'pork bacon',
    'american cheese', 'mozzarella cheese', 'butter', 'eggs', 'powdered milk',
    'rice', 'spaghetti', 'elbow macaroni', 'corn meal', 'flour',
    'ketchup', 'mustard', 'mayonnaise', 'ranch dressing', 'soy sauce',
    'apple juice', 'orange juice', 'coffee', 'water',
    'black beans', 'corn', 'diced tomato', 'tuna', 'peanut butter'
]

PRODUCT_CATEGORY_MAP = {
    'cucumber': 'produce', 'carrot': 'produce', 'onion': 'produce',
    'lettuce': 'produce', 'green pepper': 'produce',
    'chicken breast': 'meat', 'chicken drumstick': 'meat',
    'ground beef': 'meat', 'beef patty': 'meat', 'pork bacon': 'meat',
    'american cheese': 'dairy', 'mozzarella cheese': 'dairy',
    'butter': 'dairy', 'eggs': 'dairy', 'powdered milk': 'dairy',
    'rice': 'grain', 'spaghetti': 'grain', 'elbow macaroni': 'grain',
    'corn meal': 'grain', 'flour': 'grain',
    'ketchup': 'sauce/condiments', 'mustard': 'sauce/condiments',
    'mayonnaise': 'sauce/condiments', 'ranch dressing': 'sauce/condiments',
    'soy sauce': 'sauce/condiments',
    'apple juice': 'beverages', 'orange juice': 'beverages',
    'coffee': 'beverages', 'water': 'beverages',
    'black beans': 'canned', 'corn': 'canned',
    'diced tomato': 'canned', 'tuna': 'canned', 'peanut butter': 'canned'
}

BASE_PRICES = {
    'cucumber': 0.60, 'carrot': 0.63, 'onion': 0.47,
    'lettuce': 1.64, 'green pepper': 1.24,
    'chicken breast': 0.97, 'chicken drumstick': 0.42,
    'ground beef': 3.72, 'beef patty': 0.84, 'pork bacon': 3.62,
    'american cheese': 1.96, 'mozzarella cheese': 2.89,
    'butter': 3.26, 'eggs': 3.96, 'powdered milk': 2.94,
    'rice': 0.49, 'spaghetti': 1.15, 'elbow macaroni': 1.09,
    'corn meal': 0.46, 'flour': 0.44,
    'ketchup': 5.41, 'mustard': 4.26, 'mayonnaise': 13.08,
    'ranch dressing': 10.75, 'soy sauce': 13.05,
    'apple juice': 2.32, 'orange juice': 4.04,
    'coffee': 14.42, 'water': 0.32,
    'black beans': 6.92, 'corn': 5.78,
    'diced tomato': 4.77, 'tuna': 13.40, 'peanut butter': 8.91
}

# ── store brand aggressiveness (how much they discount) ────────────────────────
# 1.0 = average, >1.0 = discounts more, <1.0 = discounts less
STORE_AGGRESSIVENESS = {
    'Walmart Supercenter': 1.4,
    'Lidl': 1.35,
    'Aldi': 1.3,
    'Save-A-Lot': 1.3,
    'Giant': 1.1,
    'Safeway': 1.0,
    'Target': 0.95,
    'Trader Joe\'s': 0.9,
    'Whole Foods Market': 0.7,
    'Harris Teeter': 0.85,
    'Wegmans': 0.8,
    'default': 1.0
}

# ── ward based neighborhood pricing factor ─────────────────────────────────────
# wealthier wards (3) price higher, lower income wards (7,8) price lower
WARD_PRICE_FACTOR = {
    'Ward 1': 0.95,
    'Ward 2': 1.00,
    'Ward 3': 1.15,
    'Ward 4': 0.95,
    'Ward 5': 0.90,
    'Ward 6': 1.00,
    'Ward 7': 0.85,
    'Ward 8': 0.80,
    'default': 1.0
}

def load_store_location_data():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(base_dir, 'Grocery_Store_Locations.csv')
    store_locations = pd.read_csv(csv_path)
    store_locations = store_locations[['STORENAME', 'ADDRESS', 'ZIPCODE', 'X', 'Y', 'WARD']]
    transformer = Transformer.from_crs("EPSG:3857", "EPSG:4326", always_xy=True)
    store_locations['lng'], store_locations['lat'] = transformer.transform(
        store_locations['X'].values,
        store_locations['Y'].values
    )
    return store_locations

def get_store_aggressiveness(store_name):
    for key in STORE_AGGRESSIVENESS:
        if key.lower() in store_name.lower():
            return STORE_AGGRESSIVENESS[key]
    return STORE_AGGRESSIVENESS['default']

def get_ward_factor(ward):
    if isinstance(ward, str):
        for key in WARD_PRICE_FACTOR:
            if key.lower() in ward.lower():
                return WARD_PRICE_FACTOR[key]
    return WARD_PRICE_FACTOR['default']

def generate_data(n_samples=5000):
    store_data = load_store_location_data()
    sampled_stores = store_data.sample(n=n_samples, replace=True).reset_index(drop=True)
    store_lats = sampled_stores['lat'].values
    store_lngs = sampled_stores['lng'].values
    store_names = sampled_stores['STORENAME'].values
    store_addresses = sampled_stores['ADDRESS'].values
    store_wards = sampled_stores['WARD'].values

    store_sizes = np.random.choice(['small', 'medium', 'large'], n_samples, p=[0.3, 0.5, 0.2])
    store_products = np.random.choice(PRODUCTS, n_samples)
    store_categories = [PRODUCT_CATEGORY_MAP[item] for item in store_products]

    expiry_map = {
        'produce': 7, 'meat': 5, 'dairy': 14,
        'grain': 180, 'sauce/condiments': 30,
        'beverages': 180, 'canned': 365
    }

    max_days = [expiry_map[cat] for cat in store_categories]
    days_to_expiry = [np.random.randint(1, m) for m in max_days]
    original_prices = [BASE_PRICES[item] for item in store_products]

    # ── store aggressiveness per row ───────────────────────────────────────────
    aggressiveness = [get_store_aggressiveness(name) for name in store_names]

    # ── ward price factor per row ──────────────────────────────────────────────
    ward_factors = [get_ward_factor(ward) for ward in store_wards]

    # ── non-linear expiry curve (exponential drop near expiry) ────────────────
    # when days_to_expiry is low → expiry_ratio is low → bigger discount
    expiry_ratios = [dte / md for dte, md in zip(days_to_expiry, max_days)]
    non_linear_expiry = [np.exp(-2 * (1 - ratio)) for ratio in expiry_ratios]

    # ── realistic noise (±5% random price variance) ───────────────────────────
    noise = np.random.normal(1.0, 0.05, n_samples)
    noise = np.clip(noise, 0.85, 1.15)  # cap noise at ±15%

    # ── final discounted price formula ────────────────────────────────────────
    # combines: base formula + store aggressiveness + ward factor + 
    #           non-linear expiry + noise
    discounted_prices = []
    for i in range(n_samples):
        base_discount = 0.5 + 0.5 * expiry_ratios[i]      # original formula
        store_factor = 2.0 - aggressiveness[i]              # aggressive stores discount more
        ward_factor = ward_factors[i]                        # wealthy wards price higher
        expiry_curve = non_linear_expiry[i]                  # non-linear expiry effect
        price_noise = noise[i]                               # random market noise

        discount_factor = base_discount * store_factor * expiry_curve * price_noise
        discount_factor = np.clip(discount_factor, 0.3, 1.0) # min 30% of original
        discounted_prices.append(original_prices[i] * discount_factor * ward_factor)

    # ── quantity available ─────────────────────────────────────────────────────
    quantity_available = [
        np.random.randint(1, 100) if size == 'small'
        else np.random.randint(1, 500) if size == 'medium'
        else np.random.randint(1, 2000)
        for size in store_sizes
    ]

    max_quantity = [
        100 if size == 'small'
        else 500 if size == 'medium'
        else 2000
        for size in store_sizes
    ]

    # ── availability probability ───────────────────────────────────────────────
    prob_available = [
        min(1.0, (q / mq) * 2 + (dte / md) * 0.5)
        for q, mq, dte, md in zip(quantity_available, max_quantity, days_to_expiry, max_days)
    ]
    is_available = [1 if np.random.random() < p else 0 for p in prob_available]

    data = pd.DataFrame({
        'store_lats': store_lats,
        'store_lngs': store_lngs,
        'store_sizes': store_sizes,
        'store_products': store_products,
        'store_categories': store_categories,
        'days_to_expiry': days_to_expiry,
        'quantity_available': quantity_available,
        'original_prices': original_prices,
        'discounted_prices': discounted_prices,
        'is_available': is_available,
        'store_names': store_names,
        'store_addresses': store_addresses,
        'store_wards': store_wards,
        'store_aggressiveness': aggressiveness,
        'ward_price_factor': ward_factors,
    })
    return data

if __name__ == '__main__':
    df = generate_data()
    base_dir = os.path.dirname(os.path.abspath(__file__))
    df.to_csv(os.path.join(base_dir, 'master_dataset.csv'), index=False)
    print(f"Dataset saved! Shape: {df.shape}")
    print(df[['store_names', 'store_wards', 'store_products', 
              'original_prices', 'discounted_prices', 
              'days_to_expiry', 'store_aggressiveness']].head(10).to_string())