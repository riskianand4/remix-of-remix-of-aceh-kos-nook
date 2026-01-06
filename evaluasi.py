import pandas as pd
import pickle
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split

data = pd.read_csv('data/data_bersih.csv')

X = data['clean_text']
y = data['label']

vectorizer = pickle.load(open('vectorizer.pkl', 'rb'))
model = pickle.load(open('model_nb.pkl', 'rb'))

X_vector = vectorizer.transform(X)
X_train, X_test, y_train, y_test = train_test_split(
    X_vector, y, test_size=0.2, random_state=42
)

y_pred = model.predict(X_test)

print("Akurasi:", accuracy_score(y_test, y_pred))
print(classification_report(y_test, y_pred))
