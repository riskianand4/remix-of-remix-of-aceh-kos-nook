import pandas as pd
import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB

data = pd.read_csv("data/data_sentimen.csv")

X = data["teks"]
y = data["label"]

vectorizer = TfidfVectorizer()
X_tfidf = vectorizer.fit_transform(X)

model = MultinomialNB()
model.fit(X_tfidf, y)

# SIMPAN MODEL & VECTORIZER
pickle.dump(model, open("model/model_nb.pkl", "wb"))
pickle.dump(vectorizer, open("model/vectorizer.pkl", "wb"))

print("Model & vectorizer berhasil disimpan")
