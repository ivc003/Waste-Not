import numpy as np
import pandas as pd
import xgboost as xgb
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix, mean_absolute_error, r2_score, accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from data.my_data import generate_data
from model.train import prepare_features

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

def plot_feature_importance(model, title, top_n=15):
    importance = model.get_score(importance_type='gain')
    importance_df = pd.DataFrame({
        'feature': list(importance.keys()),
        'importance': list(importance.values())
    }).sort_values('importance', ascending=False).head(top_n)
    
    plt.figure(figsize=(10, 6))
    sns.barplot(data=importance_df, x='importance', y='feature', palette='viridis')
    plt.title(f'Feature Importance - {title}', fontsize=14, fontweight='bold')
    plt.xlabel('Importance (Gain)')
    plt.ylabel('Feature')
    plt.tight_layout()
    plt.savefig(f'../models_saved/{title.lower().replace(" ", "_")}_feature_importance.png')
    plt.show()
    print(f"Saved feature importance plot for {title}")

def plot_confusion_matrix(y_true, y_pred):
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=['Unavailable', 'Available'],
                yticklabels=['Unavailable', 'Available'])
    plt.title('Availability Model - Confusion Matrix', fontsize=14, fontweight='bold')
    plt.ylabel('Actual')
    plt.xlabel('Predicted')
    plt.tight_layout()
    plt.savefig('../models_saved/confusion_matrix.png')
    plt.show()
    print("Saved confusion matrix")

def plot_price_predictions(y_true, y_pred):
    plt.figure(figsize=(8, 6))
    plt.scatter(y_true, y_pred, alpha=0.3, color='steelblue', edgecolors='none')
    min_val = min(y_true.min(), y_pred.min())
    max_val = max(y_true.max(), y_pred.max())
    plt.plot([min_val, max_val], [min_val, max_val], 'r--', linewidth=2, label='Perfect Prediction')
    plt.xlabel('Actual Price ($)')
    plt.ylabel('Predicted Price ($)')
    plt.title('Price Model - Actual vs Predicted', fontsize=14, fontweight='bold')
    plt.legend()
    plt.tight_layout()
    plt.savefig('../models_saved/price_predictions.png')
    plt.show()
    print("Saved price prediction plot")

def plot_match_score_distribution(y_true, y_pred):
    plt.figure(figsize=(10, 5))
    plt.subplot(1, 2, 1)
    plt.hist(y_true, bins=30, color='steelblue', alpha=0.7, edgecolor='black')
    plt.title('Actual Match Score Distribution')
    plt.xlabel('Match Score')
    plt.ylabel('Count')
    plt.subplot(1, 2, 2)
    plt.hist(y_pred, bins=30, color='coral', alpha=0.7, edgecolor='black')
    plt.title('Predicted Match Score Distribution')
    plt.xlabel('Match Score')
    plt.ylabel('Count')
    plt.tight_layout()
    plt.savefig('../models_saved/match_score_distribution.png')
    plt.show()
    print("Saved match score distribution plot")

def evaluate():
    print("Generating data...")
    df = generate_data()
    X, y_price, y_availability, y_match = prepare_features(df)

    X_train, X_test, y_price_train, y_price_test = train_test_split(X, y_price, test_size=0.2, random_state=42)
    _, _, y_avail_train, y_avail_test = train_test_split(X, y_availability, test_size=0.2, random_state=42)
    _, _, y_match_train, y_match_test = train_test_split(X, y_match, test_size=0.2, random_state=42)

    print("Loading models...")
    model_price, model_avail, model_match = load_models()

    dtest_price = xgb.DMatrix(X_test, label=y_price_test)
    dtest_avail = xgb.DMatrix(X_test, label=y_avail_test)
    dtest_match = xgb.DMatrix(X_test, label=y_match_test)

    price_preds = model_price.predict(dtest_price)
    avail_preds_prob = model_avail.predict(dtest_avail)
    avail_preds = (avail_preds_prob > 0.5).astype(int)
    match_preds = model_match.predict(dtest_match)

    print("\n========== MODEL EVALUATION ==========")
    print(f"\n--- Price Model ---")
    print(f"MAE:      ${mean_absolute_error(y_price_test, price_preds):.4f}")
    print(f"R2 Score:  {r2_score(y_price_test, price_preds):.4f}")

    print(f"\n--- Availability Model ---")
    print(f"Accuracy:  {accuracy_score(y_avail_test, avail_preds):.4f}")

    print(f"\n--- Match Score Model ---")
    print(f"MAE:       {mean_absolute_error(y_match_test, match_preds):.4f}")
    print(f"R2 Score:  {r2_score(y_match_test, match_preds):.4f}")
    print("\n=======================================")

    print("\nGenerating plots...")
    plot_feature_importance(model_price, 'Price Model')
    plot_feature_importance(model_avail, 'Availability Model')
    plot_feature_importance(model_match, 'Match Score Model')
    plot_confusion_matrix(y_avail_test, avail_preds)
    plot_price_predictions(y_price_test, price_preds)
    plot_match_score_distribution(y_match_test, match_preds)
    print("\nAll plots saved to models_saved/")

if __name__ == '__main__':
    evaluate()