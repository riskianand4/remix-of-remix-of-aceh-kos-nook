import pandas as pd
import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.model_selection import train_test_split
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load data yang sudah dipreprocess
data = pd.read_csv(os.path.join(BASE_DIR, 'data/data_bersih.csv'))

X = data['clean_text']
y = data['label']

# Vectorisasi dengan TF-IDF
vectorizer = TfidfVectorizer()
X_vector = vectorizer.fit_transform(X)

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X_vector, y, test_size=0.2, random_state=42
)

# Training model Naive Bayes
model = MultinomialNB()
model.fit(X_train, y_train)

# Simpan model dan vectorizer
model_dir = os.path.join(BASE_DIR, 'model')
os.makedirs(model_dir, exist_ok=True)

pickle.dump(model, open(os.path.join(model_dir, 'model_nb.pkl'), 'wb'))
pickle.dump(vectorizer, open(os.path.join(model_dir, 'vectorizer.pkl'), 'wb'))

print("Training selesai!")
print(f"Model disimpan di: {model_dir}")
print(f"Akurasi pada test set: {model.score(X_test, y_test):.2%}")
