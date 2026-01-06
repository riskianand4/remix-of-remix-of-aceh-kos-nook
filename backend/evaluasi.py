import pandas as pd
import pickle
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load data
data = pd.read_csv(os.path.join(BASE_DIR, 'data/data_bersih.csv'))

X = data['clean_text']
y = data['label']

# Load model dan vectorizer
vectorizer = pickle.load(open(os.path.join(BASE_DIR, 'model/vectorizer.pkl'), 'rb'))
model = pickle.load(open(os.path.join(BASE_DIR, 'model/model_nb.pkl'), 'rb'))

# Transform dan split
X_vector = vectorizer.transform(X)
X_train, X_test, y_train, y_test = train_test_split(
    X_vector, y, test_size=0.2, random_state=42
)

# Prediksi
y_pred = model.predict(X_test)

# Evaluasi
print("=" * 50)
print("EVALUASI MODEL SENTIMENT ANALYSIS")
print("=" * 50)
print(f"\nAkurasi: {accuracy_score(y_test, y_pred):.2%}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred))
print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))
