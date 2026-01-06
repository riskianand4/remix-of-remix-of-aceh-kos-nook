from flask import Flask, render_template, request
import pickle

app = Flask(__name__)

# load model
model = pickle.load(open('model/model_nb.pkl', 'rb'))
vectorizer = pickle.load(open('model/vectorizer.pkl', 'rb'))

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/analisis', methods=['GET', 'POST'])
def analisis():
    hasil = None
    teks = ""
    if request.method == 'POST':
        teks = request.form['teks']
        vektor = vectorizer.transform([teks])
        hasil = model.predict(vektor)[0]
    return render_template('analisis.html', hasil=hasil, teks=teks)

@app.route('/dataset')
def dataset():
    return render_template('dataset.html')

@app.route('/tentang')
def tentang():
    return render_template('tentang.html')

if __name__ == '__main__':
    app.run(debug=True)
