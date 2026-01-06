import pandas as pd
import re
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import os

# Download NLTK data
nltk.download('punkt')
nltk.download('stopwords')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load data
data = pd.read_csv(os.path.join(BASE_DIR, 'data/data_sentimen.csv'))

# Fungsi preprocessing
def preprocess(text):
    # Lowercase
    text = text.lower()
    # Hapus karakter khusus
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    # Tokenisasi
    tokens = word_tokenize(text)
    # Hapus stopwords
    stop_words = set(stopwords.words('indonesian'))
    tokens = [t for t in tokens if t not in stop_words]
    return ' '.join(tokens)

# Terapkan preprocessing
data['clean_text'] = data['teks'].apply(preprocess)

# Simpan hasil
output_path = os.path.join(BASE_DIR, 'data/data_bersih.csv')
data.to_csv(output_path, index=False)

print(f"Preprocessing selesai! File disimpan di: {output_path}")
print(f"Total data: {len(data)} baris")
