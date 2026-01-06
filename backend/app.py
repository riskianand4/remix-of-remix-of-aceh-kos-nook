from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import pandas as pd
import numpy as np
import os
from datetime import datetime, timedelta
import random
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report

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

@app.route('/api/evaluation')
def get_evaluation():
    """Get model evaluation metrics"""
    try:
        data = pd.read_csv(get_data_path('data_sentimen.csv'))
        
        X = data['teks']
        y = data['label']
        
        # Split data for evaluation
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Transform and predict
        X_test_vec = vectorizer.transform(X_test)
        y_pred = model.predict(X_test_vec)
        
        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
        recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
        f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
        
        # Confusion matrix
        labels = ['negatif', 'netral', 'positif']
        cm = confusion_matrix(y_test, y_pred, labels=labels)
        
        # Classification report
        report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
        
        return jsonify({
            'accuracy': float(accuracy),
            'precision': float(precision),
            'recall': float(recall),
            'f1_score': float(f1),
            'confusion_matrix': cm.tolist(),
            'classification_report': report
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/wordcloud')
def get_wordcloud():
    """Get word frequency data for wordcloud visualization"""
    try:
        sentiment = request.args.get('sentiment', None)
        data = pd.read_csv(get_data_path('data_sentimen.csv'))
        
        # Filter by sentiment if specified
        if sentiment and sentiment in ['positif', 'negatif', 'netral']:
            data = data[data['label'] == sentiment]
        
        # Combine all texts
        all_text = ' '.join(data['teks'].astype(str).tolist())
        
        # Simple tokenization and word counting
        words = all_text.lower().split()
        
        # Indonesian stopwords
        stopwords = {
            'yang', 'dan', 'di', 'ke', 'dari', 'ini', 'itu', 'dengan', 'untuk',
            'pada', 'adalah', 'tidak', 'ada', 'juga', 'akan', 'atau', 'sudah',
            'bisa', 'saya', 'kami', 'kita', 'mereka', 'dia', 'ia', 'anda',
            'sangat', 'lebih', 'hanya', 'karena', 'oleh', 'tersebut', 'dapat',
            'telah', 'dalam', 'sebagai', 'saat', 'setelah', 'jika', 'maka',
            'tetapi', 'namun', 'bahwa', 'seperti', 'lagi', 'masih', 'nya',
            'ya', 'yg', 'dgn', 'utk', 'sm', 'bgt', 'gak', 'ga', 'tdk', 'dr',
            'rt', 'amp', 'http', 'https', 'co', 'www', 'com', 'a', 'b', 'c'
        }
        
        # Count words (exclude stopwords and short words)
        word_count = {}
        for word in words:
            # Clean word (remove punctuation)
            clean_word = ''.join(c for c in word if c.isalnum())
            if len(clean_word) > 2 and clean_word not in stopwords:
                word_count[clean_word] = word_count.get(clean_word, 0) + 1
        
        # Sort by frequency and get top 50
        sorted_words = sorted(word_count.items(), key=lambda x: x[1], reverse=True)[:50]
        
        result = [{'text': word, 'value': count} for word, count in sorted_words]
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health')
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'message': 'Backend is running'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
