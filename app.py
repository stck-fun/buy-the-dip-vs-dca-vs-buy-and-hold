from flask import Flask, render_template, request, jsonify
from collections import OrderedDict
import os
import yfinance as yf
import pandas as pd
import logging
from logging.handlers import RotatingFileHandler
from functools import wraps
from investment import calculate_strategies

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def validate_input(f):
    """Decorator to validate input parameters for routes."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.is_json:
            data = request.get_json()
            if 'ticker' in data:
                if not isinstance(data['ticker'], str) or len(data['ticker']) > 10:
                    return jsonify({'error': 'Invalid ticker symbol'}), 400
            if 'amount' in data:
                try:
                    amount = float(data['amount'])
                    if amount <= 0:
                        return jsonify({'error': 'Amount must be positive'}), 400
                except ValueError:
                    return jsonify({'error': 'Invalid amount value'}), 400
            if 'frequency' in data and data['frequency'] not in ['Daily', 'Weekly', 'Bi-Weekly', 'Monthly', 'Annual']:
                return jsonify({'error': 'Invalid frequency value'}), 400
        return f(*args, **kwargs)
    return decorated_function

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY") or "a secret key"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
@validate_input
def analyze():
    """
    Analyze investment strategies for a given stock.
    
    Expected JSON payload:
    {
        "ticker": str,        # Stock symbol
        "amount": float,      # Investment amount
        "frequency": str,     # Investment frequency (Daily/Weekly/Monthly)
        "timeline": int,      # Analysis timeline in months
        "trailingPercentage": float  # Trailing stop percentage
    }
    
    Returns:
        JSON with analysis results or error message
    """
    try:
        data = request.get_json()
        ticker = data['ticker'].upper()
        amount = float(data['amount'])
        frequency = data['frequency']
        timeline = int(data['timeline'])
        trailing_percentage = float(data['trailingPercentage'])
        
        logger.info(f"Analyzing {ticker} with amount={amount}, frequency={frequency}, "
                   f"timeline={timeline}, trailing_percentage={trailing_percentage}")

        try:
            stock = yf.Ticker(ticker)
            # Validate ticker exists and get stock info
            info = stock.info
            if not info:
                logger.error(f"Invalid ticker symbol: {ticker}")
                return jsonify({'error': f'Invalid ticker symbol: {ticker}'})
            
            # Get stock name, fallback to ticker if not available
            stock_name = info.get('longName', ticker)
        except Exception as e:
            logger.error(f"Error fetching ticker {ticker}: {str(e)}")
            return jsonify({'error': f'Error fetching ticker {ticker}: {str(e)}'})

        # Map the timeline value to the appropriate period string
        if timeline <= 1:
            next_largest_period = '1mo'
        elif timeline <= 3:
            next_largest_period = '3mo'
        elif timeline <= 6:
            next_largest_period = '6mo'
        elif timeline <= 12:
            next_largest_period = '1y'
        elif timeline <= 24:
            next_largest_period = '2y'
        elif timeline <= 60:
            next_largest_period = '5y'
        else:
            next_largest_period = 'max'

        # Always get maximum available history
        hist_data_full = stock.history(period="max")  # Get complete history
        
        if hist_data_full.empty:
            return jsonify({'error': f'No data available for {ticker}'})

        # Create filtered dataset for the specified timeline
        end_date = hist_data_full.index[-1]
        start_date = end_date - pd.DateOffset(months=timeline)
        hist_data = hist_data_full.loc[start_date:end_date].copy()

        if hist_data.empty:
            return jsonify({'error': f'Insufficient data for the specified timeline'})

        # Pass both full and filtered data to calculate_strategies
        analysis_results = calculate_strategies(hist_data, hist_data_full, amount, frequency, timeline, trailing_percentage)
        logger.info(f"Stock lifetime calculation - Start date: {hist_data_full.index[0]}, End date: {hist_data_full.index[-1]}")
        # Add stock information to the response
        analysis_results['stock_info'] = {
            'name': stock_name,
            'ticker': ticker
        }
        
        # Log rolling returns data for debugging
        if 'summary' in analysis_results and 'rolling_returns' in analysis_results['summary']:
            logger.info(f"Rolling returns data: {analysis_results['summary']['rolling_returns']}")
        else:
            logger.warning("Rolling returns data not found in analysis results")
            
        return jsonify(analysis_results)
    except Exception as e:
        print(f"Error analyzing {ticker}: {str(e)}")
        return jsonify({'error': f'Error processing {ticker}: Invalid stock symbol or no data available'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
