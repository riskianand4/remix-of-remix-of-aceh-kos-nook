from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import pandas as pd
import os
from datetime import datetime, timedelta
import random

app = Flask(__name__)
CORS(app)

# Get the directory where this script is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load model
model = pickle.load(open(os.path.join(BASE_DIR, 'model/model_nb.pkl'), 'rb'))
vectorizer = pickle.load(open(os.path.join(BASE_DIR, 'model/vectorizer.pkl'), 'rb'))

def get_data_path(filename):
    return os.path.join(BASE_DIR, 'data', filename)

@app.route('/api/stats')
def get_stats():
    """Get sentiment statistics from dataset"""
    try:
        data = pd.read_csv(get_data_path('data_sentimen.csv'))
        stats = data['label'].value_counts().to_dict()
        return jsonify({
            'total': len(data),
            'positif': stats.get('positif', 0),
            'negatif': stats.get('negatif', 0),
            'netral': stats.get('netral', 0)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze', methods=['POST'])
def analyze():
    """Analyze sentiment of input text"""
    try:
        text = request.json.get('text', '')
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        vector = vectorizer.transform([text])
        prediction = model.predict(vector)[0]
        probabilities = model.predict_proba(vector)[0]
        classes = model.classes_.tolist()
        
        # Map probabilities to class names
        prob_dict = {}
        for i, cls in enumerate(classes):
            prob_dict[cls] = float(probabilities[i])
        
        return jsonify({
            'text': text,
            'sentiment': prediction,
            'confidence': float(max(probabilities)),
            'probabilities': {
                'positif': prob_dict.get('positif', 0),
                'negatif': prob_dict.get('negatif', 0),
                'netral': prob_dict.get('netral', 0)
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dataset')
def get_dataset():
    """Get all dataset items"""
    try:
        data = pd.read_csv(get_data_path('data_sentimen.csv'))
        sources = ['Twitter', 'Facebook', 'Instagram', 'Website']
        
        result = []
        for i, row in data.iterrows():
            result.append({
                'id': str(i),
                'text': row['teks'],
                'sentiment': row['label'],
                'source': sources[i % len(sources)]
            })
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/mentions')
def get_mentions():
    """Get mentions with pagination"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        data = pd.read_csv(get_data_path('data_sentimen.csv'))
        
        # Calculate pagination
        start = (page - 1) * limit
        end = start + limit
        
        # Generate realistic timestamps
        base_time = datetime.now()
        
        mentions = []
        for idx, (i, row) in enumerate(data.iloc[start:end].iterrows()):
            # Create decreasing timestamps
            created_at = base_time - timedelta(hours=idx * 2, minutes=random.randint(0, 59))
            
            # Analyze text to get confidence
            vector = vectorizer.transform([row['teks']])
            probabilities = model.predict_proba(vector)[0]
            
            mentions.append({
                'id': str(i),
                'text': row['teks'],
                'sentiment': row['label'],
                'confidence': float(max(probabilities)),
                'createdAt': created_at.isoformat() + 'Z'
            })
        
        return jsonify({
            'data': mentions,
            'total': len(data)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health')
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'message': 'Backend is running'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
