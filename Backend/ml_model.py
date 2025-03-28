import sys
import pandas as pd
import json
import numpy as np
from xgboost import XGBRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import matplotlib.pyplot as plt
import seaborn as sns
import base64
from io import BytesIO

def train_model_with_analytics(file_path):
    try:
        df = pd.read_csv(file_path)

        # Selecting relevant columns
        df = df[['name', 'brand', 'prices.amountMin', 'prices.amountMax', 'prices.dateSeen']]
        df = df.dropna()  # Removing null values

        # Convert price columns to numeric
        df['prices.amountMin'] = pd.to_numeric(df['prices.amountMin'], errors='coerce')
        df['prices.amountMax'] = pd.to_numeric(df['prices.amountMax'], errors='coerce')

        # Convert date to datetime format with specified format and extract time-based features
        df['prices.dateSeen'] = pd.to_datetime(
            df['prices.dateSeen'], 
            errors='coerce',
            format='mixed'  # This handles multiple date formats automatically
        )
        
        # Drop rows with invalid dates or prices
        df = df.dropna(subset=['prices.dateSeen', 'prices.amountMin', 'prices.amountMax'])

        # Extract date components
        df['year'] = df['prices.dateSeen'].dt.year
        df['month'] = df['prices.dateSeen'].dt.month
        df['day'] = df['prices.dateSeen'].dt.day

        # Average price calculation
        df['avg_price'] = (df['prices.amountMin'] + df['prices.amountMax']) / 2

        # Encoding categorical data (brand)
        le_brand = LabelEncoder()
        df['brand'] = le_brand.fit_transform(df['brand'])

        # Features and Target
        X = df[['brand', 'year', 'month', 'day', 'prices.amountMin', 'prices.amountMax']]
        y = df['avg_price']

        # Splitting data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        # Model Training - Changed to XGBoost
        model = XGBRegressor(
            objective='reg:squarederror',
            n_estimators=100,
            learning_rate=0.1,
            max_depth=6,
            random_state=42
        )
        model.fit(X_train, y_train)

        # Predictions
        train_predictions = model.predict(X_train)
        test_predictions = model.predict(X_test)
        all_predictions = model.predict(X)

        # Add predictions to dataframe
        df['predicted_price'] = all_predictions.round(2)

        # Metrics calculation
        metrics = {
            'r2_score': r2_score(y_test, test_predictions),
            'mean_squared_error': mean_squared_error(y_test, test_predictions),
            'mean_absolute_error': mean_absolute_error(y_test, test_predictions),
            'coefficient_of_determination': model.score(X_test, y_test)
        }

        # Feature importance
        feature_importance = {
            'features': ['brand', 'year', 'month', 'day', 'prices.amountMin', 'prices.amountMax'],
            'importance': model.feature_importances_.tolist()  # Changed to feature_importances_ for XGBoost
        }

        # Generate correlation matrix
        correlation_matrix = df[['brand', 'year', 'month', 'day', 'prices.amountMin', 'prices.amountMax', 'avg_price']].corr()

        # Generate graphs
        graphs = {}

        # Correlation Matrix Heatmap
        plt.figure(figsize=(10, 8))
        sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm', fmt='.2f')
        plt.title('Correlation Matrix')
        fig_corr = plt.gcf()
        graphs['correlation_matrix'] = fig_to_base64(fig_corr)
        plt.close(fig_corr)

        # Actual vs Predicted Price
        plt.figure(figsize=(10, 6))
        plt.scatter(y_test, test_predictions, alpha=0.5)
        plt.plot([y.min(), y.max()], [y.min(), y.max()], 'r--')
        plt.xlabel('Actual Price')
        plt.ylabel('Predicted Price')
        plt.title('Actual vs Predicted Price')
        fig_pred = plt.gcf()
        graphs['actual_vs_predicted'] = fig_to_base64(fig_pred)
        plt.close(fig_pred)

        # Residuals Plot
        plt.figure(figsize=(10, 6))
        residuals = y_test - test_predictions
        plt.scatter(test_predictions, residuals, alpha=0.5)
        plt.axhline(y=0, color='r', linestyle='--')
        plt.xlabel('Predicted Price')
        plt.ylabel('Residuals')
        plt.title('Residuals Plot')
        fig_resid = plt.gcf()
        graphs['residuals'] = fig_to_base64(fig_resid)
        plt.close(fig_resid)

        # Price Distribution
        plt.figure(figsize=(10, 6))
        sns.histplot(df['avg_price'], kde=True)
        plt.title('Price Distribution')
        plt.xlabel('Price')
        fig_dist = plt.gcf()
        graphs['price_distribution'] = fig_to_base64(fig_dist)
        plt.close(fig_dist)

        # Brand vs Price
        plt.figure(figsize=(12, 6))
        brand_decoded = le_brand.inverse_transform(df['brand'])
        brand_price_df = pd.DataFrame({'brand': brand_decoded, 'avg_price': df['avg_price']})
        brand_summary = brand_price_df.groupby('brand')['avg_price'].mean().sort_values(ascending=False)
        sns.barplot(x=brand_summary.index, y=brand_summary.values)
        plt.title('Average Price by Brand')
        plt.xlabel('Brand')
        plt.ylabel('Average Price')
        plt.xticks(rotation=45)
        fig_brand = plt.gcf()
        graphs['brand_price'] = fig_to_base64(fig_brand)
        plt.close(fig_brand)

        # Prepare output
        output = df[['name', 'brand', 'predicted_price']].copy()
        output['brand'] = le_brand.inverse_transform(output['brand'])

        analytics = {
            'metrics': metrics,
            'feature_importance': feature_importance,
            'correlation_matrix_data': correlation_matrix.to_dict(),
            'graphs': graphs
        }

        result = {
            'predictions': output.to_dict(orient="records"),
            'analytics': analytics
        }

        print(json.dumps(result, ensure_ascii=False))  # JSON output

    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

def fig_to_base64(fig):
    """Convert matplotlib figure to base64 string for embedding in JSON"""
    buf = BytesIO()
    fig.savefig(buf, format='png')
    buf.seek(0)
    img_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
    return img_base64

if __name__ == "__main__":
    train_model_with_analytics(sys.argv[1])