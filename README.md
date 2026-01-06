# Sentiment Analysis PIM (Pupuk Iskandar Muda)

Aplikasi analisis sentimen publik untuk PT Pupuk Iskandar Muda menggunakan Machine Learning (Naive Bayes) dengan frontend React dan backend Flask.

## 📁 Struktur Proyek

```
project/
├── backend/                    # Backend Flask REST API
│   ├── app.py                 # Server utama
│   ├── preprocessing.py       # Script preprocessing data
│   ├── training.py           # Script training model
│   ├── evaluasi.py           # Script evaluasi model
│   ├── visualisasi.py        # Script visualisasi data
│   ├── requirements.txt      # Dependencies Python
│   ├── model/
│   │   ├── model_nb.pkl      # Model Naive Bayes
│   │   └── vectorizer.pkl    # TF-IDF Vectorizer
│   └── data/
│       ├── data_sentimen.csv # Dataset mentah
│       └── data_bersih.csv   # Dataset yang sudah dipreprocess
│
├── src/                       # Frontend React
│   ├── components/           # Komponen UI
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utilities dan API client
│   ├── pages/                # Halaman aplikasi
│   └── types/                # TypeScript types
│
├── package.json              # Dependencies Node.js
└── vite.config.ts           # Konfigurasi Vite
```

## 🚀 Cara Menjalankan

### 1. Setup Backend

```bash
# Masuk ke folder backend
cd backend

# Install dependencies Python
pip install -r requirements.txt

# Jalankan server Flask
python app.py
```

Server backend akan berjalan di: **http://localhost:5000**

### 2. Setup Frontend

```bash
# Kembali ke root folder (jika di backend)
cd ..

# Install dependencies Node.js
npm install

# Jalankan development server
npm run dev
```

Aplikasi frontend akan berjalan di: **http://localhost:8080**

### 3. Konfigurasi Environment (Opsional)

Jika backend berjalan di URL yang berbeda, buat file `.env` di root folder:

```env
VITE_API_URL=http://localhost:5000
```

## 📡 API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/stats` | Statistik sentimen dari dataset |
| POST | `/api/analyze` | Analisis sentimen teks baru |
| GET | `/api/dataset` | Ambil semua data training |
| GET | `/api/mentions` | Ambil mentions dengan pagination |
| GET | `/api/health` | Health check server |

### Contoh Request

**Analisis Teks:**
```bash
curl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "Pupuk PIM sangat bagus untuk tanaman saya"}'
```

**Response:**
```json
{
  "text": "Pupuk PIM sangat bagus untuk tanaman saya",
  "sentiment": "positif",
  "confidence": 0.89,
  "probabilities": {
    "positif": 0.89,
    "negatif": 0.05,
    "netral": 0.06
  }
}
```

## 🤖 Training Model

Jika ingin melatih ulang model dengan data baru:

```bash
cd backend

# 1. Preprocessing data
python preprocessing.py

# 2. Training model
python training.py

# 3. Evaluasi model
python evaluasi.py

# 4. Visualisasi (opsional)
python visualisasi.py
```

## 📊 Fitur Aplikasi

- **Dashboard**: Statistik sentimen real-time dengan chart
- **Analisis**: Input teks untuk analisis sentimen
- **Dataset**: Lihat dan filter data training
- **Tentang**: Informasi tentang aplikasi

## 🛠️ Teknologi

**Frontend:**
- React 19
- TypeScript
- Tailwind CSS
- Recharts (visualisasi)
- React Router

**Backend:**
- Flask
- Pandas
- Scikit-learn (Naive Bayes)
- NLTK (preprocessing)

## 📝 Catatan

- Pastikan backend sudah berjalan sebelum membuka frontend
- Model sudah di-training dan siap digunakan
- Dataset berisi contoh sentimen terkait PT Pupuk Iskandar Muda
