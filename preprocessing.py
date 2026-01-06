import pandas as pd
import re
import nltk
from nltk.corpus import stopwords

nltk.download('stopwords')
stop_words = stopwords.words('indonesian')

data = pd.read_csv('data/data_sentimen.csv')

def clean_text(text):
    text = text.lower()
    text = re.sub(r'[^a-zA-Z ]', '', text)
    words = text.split()
    words = [w for w in words if w not in stop_words]
    return ' '.join(words)

data['clean_text'] = data['teks'].apply(clean_text)
data.to_csv('data/data_bersih.csv', index=False)

print("Preprocessing selesai")
