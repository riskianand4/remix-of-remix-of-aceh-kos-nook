# Laporan Skripsi - Sistem Analisis Sentimen SentimenPIM
## Sistem Analisis Sentimen Publik Terhadap PT Pupuk Iskandar Muda Menggunakan Algoritma Naive Bayes

---

## 4.1.2 Arsitektur Sistem

### A.1 Arsitektur Sistem Utama

```mermaid
flowchart TD
    classDef userClass fill:#E8F4FD,stroke:#1E88E5,stroke-width:2px,color:#0D47A1
    classDef frontendClass fill:#E3F2FD,stroke:#42A5F5,stroke-width:2px,color:#1565C0
    classDef cloudClass fill:#F3E5F5,stroke:#AB47BC,stroke-width:2px,color:#6A1B9A
    classDef backendClass fill:#E8F5E9,stroke:#66BB6A,stroke-width:2px,color:#2E7D32
    classDef dataClass fill:#FFF3E0,stroke:#FFA726,stroke-width:2px,color:#E65100
    classDef externalClass fill:#FFEBEE,stroke:#EF5350,stroke-width:2px,color:#C62828

    User([Pengguna]):::userClass
    
    subgraph Frontend["Frontend Layer"]
        direction TB
        React[React + Vite + TypeScript]
        UI[Komponen UI]
        State[State Management]
    end
    
    subgraph Cloud["Lovable Cloud"]
        direction TB
        Edge1[Edge Function: scrape-url]
        Edge2[Edge Function: analyze-sentiment-llm]
        Supabase[(Database: analysis_history)]
    end
    
    subgraph Backend["Backend Layer"]
        direction TB
        Flask[Flask REST API]
        ML[Pipeline ML]
    end
    
    subgraph MLModel["Model ML"]
        direction TB
        TFIDF[TF-IDF Vectorizer]
        NB[Naive Bayes Classifier]
    end
    
    subgraph Data["Penyimpanan Data"]
        direction TB
        CSV1[(data_sentimen.csv)]
        CSV2[(data_bersih.csv)]
        PKL1[(model_nb.pkl)]
        PKL2[(vectorizer.pkl)]
    end
    
    subgraph External["Layanan Eksternal"]
        direction TB
        Firecrawl[Firecrawl API]
        Gemini[Lovable AI Gateway]
    end
    
    User --> Frontend
    Frontend --> Cloud
    Frontend --> Backend
    Cloud --> External
    Backend --> MLModel
    MLModel --> Data
    Cloud --> Supabase
    
    class Frontend frontendClass
    class Cloud cloudClass
    class Backend backendClass
    class Data dataClass
    class External externalClass
```

### A.2 Arsitektur Alur Data

```mermaid
flowchart TD
    classDef inputClass fill:#E3F2FD,stroke:#1976D2,stroke-width:2px,color:#0D47A1
    classDef processClass fill:#E8F5E9,stroke:#43A047,stroke-width:2px,color:#1B5E20
    classDef outputClass fill:#FFF8E1,stroke:#FFB300,stroke-width:2px,color:#FF6F00
    classDef storageClass fill:#FCE4EC,stroke:#EC407A,stroke-width:2px,color:#AD1457
    
    I1[Input Teks Manual]:::inputClass
    I2[Input URL Berita]:::inputClass
    
    P1[Preprocessing Teks]:::processClass
    P2[Web Scraping]:::processClass
    P3[Analisis ML]:::processClass
    P4[Analisis LLM]:::processClass
    
    O1[Hasil Sentimen]:::outputClass
    O2[Confidence Score]:::outputClass
    O3[Reasoning AI]:::outputClass
    
    S1[(Riwayat Analisis)]:::storageClass
    
    I1 --> P1
    I2 --> P2
    P2 --> P1
    P1 --> P3
    P1 --> P4
    P3 --> O1
    P3 --> O2
    P4 --> O1
    P4 --> O2
    P4 --> O3
    O1 --> S1
```

---

## 4.1.3 Entity Relationship Diagram (ERD)

### B.1 ERD Sistem Analisis Sentimen

```mermaid
erDiagram
    USERS {
        uuid id PK
        string email
        timestamp created_at
        timestamp last_sign_in
    }
    
    ANALYSIS_HISTORY {
        uuid id PK
        uuid user_id FK
        text text
        string sentiment
        decimal confidence
        string method
        string model
        text reasoning
        string source_url
        string source_title
        jsonb probabilities
        timestamp created_at
    }
    
    DATA_SENTIMEN {
        int id PK
        text teks
        string label
    }
    
    DATA_BERSIH {
        int id PK
        text teks
        string label
        text clean_text
    }
    
    MODEL_FILE {
        string name PK
        string type
        timestamp updated_at
    }
    
    USERS ||--o{ ANALYSIS_HISTORY : "memiliki"
    DATA_SENTIMEN ||--|| DATA_BERSIH : "diproses menjadi"
    DATA_BERSIH ||--o{ MODEL_FILE : "melatih"
```

### B.2 ERD Database Cloud (analysis_history)

```mermaid
erDiagram
    USERS ||--o{ ANALYSIS_HISTORY : "memiliki"
    
    USERS {
        uuid id PK "UUID Primary Key"
        string email "Email pengguna"
        timestamp created_at "Waktu registrasi"
    }
    
    ANALYSIS_HISTORY {
        uuid id PK "UUID Primary Key"
        uuid user_id FK "Referensi ke Users"
        text text "Teks yang dianalisis"
        string sentiment "positif/negatif/netral"
        decimal confidence "Skor keyakinan 0-1"
        string method "ml atau llm"
        string model "Nama model"
        text reasoning "Penjelasan AI"
        string source_url "URL sumber"
        string source_title "Judul artikel"
        jsonb probabilities "Probabilitas tiap kelas"
        timestamp created_at "Waktu analisis"
    }
```

---

## 4.1.4 Use Case Diagram

### C.1 Use Case - Pengguna Umum

```mermaid
flowchart TD
    classDef actorClass fill:#BBDEFB,stroke:#1976D2,stroke-width:2px,color:#0D47A1
    classDef ucClass fill:#E3F2FD,stroke:#42A5F5,stroke-width:1px,color:#1565C0
    classDef includeClass fill:#F3E5F5,stroke:#AB47BC,stroke-width:1px,color:#7B1FA2
    classDef extendClass fill:#FFF3E0,stroke:#FF9800,stroke-width:1px,color:#E65100
    classDef boundaryClass fill:#FAFAFA,stroke:#9E9E9E,stroke-width:2px

    User([Pengguna]):::actorClass
    
    subgraph Sistem["Sistem SentimenPIM"]
        UC1[Lihat Dashboard]:::ucClass
        UC2[Analisis Teks]:::ucClass
        UC3[Analisis URL]:::ucClass
        UC4[Lihat Dataset]:::ucClass
        UC5[Lihat Evaluasi]:::ucClass
        UC6[Lihat Riwayat]:::ucClass
        
        INC1([Preprocessing]):::includeClass
        INC2([Prediksi ML]):::includeClass
        INC3([Prediksi LLM]):::includeClass
        INC4([Web Scraping]):::includeClass
        INC5([Autentikasi]):::includeClass
        
        EXT1([Export CSV]):::extendClass
        EXT2([Filter Sentimen]):::extendClass
    end
    
    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    User --> UC6
    
    UC2 -.->|include| INC1
    UC2 -.->|include| INC2
    UC2 -.->|include| INC3
    UC3 -.->|include| INC4
    UC3 -.->|include| INC1
    UC6 -.->|include| INC5
    
    UC4 -.->|extend| EXT1
    UC1 -.->|extend| EXT2
    
    class Sistem boundaryClass
```

### C.2 Use Case - Administrator

```mermaid
flowchart TD
    classDef actorClass fill:#C8E6C9,stroke:#388E3C,stroke-width:2px,color:#1B5E20
    classDef ucClass fill:#E8F5E9,stroke:#66BB6A,stroke-width:1px,color:#2E7D32
    classDef includeClass fill:#F3E5F5,stroke:#AB47BC,stroke-width:1px,color:#7B1FA2

    Admin([Administrator]):::actorClass
    
    subgraph Sistem["Sistem SentimenPIM - Admin"]
        UC1[Training Model]:::ucClass
        UC2[Preprocessing Dataset]:::ucClass
        UC3[Evaluasi Model]:::ucClass
        UC4[Update Slang Dictionary]:::ucClass
        
        INC1([Load Dataset]):::includeClass
        INC2([TF-IDF Vectorization]):::includeClass
        INC3([Cross Validation]):::includeClass
        INC4([GridSearchCV]):::includeClass
    end
    
    Admin --> UC1
    Admin --> UC2
    Admin --> UC3
    Admin --> UC4
    
    UC1 -.->|include| INC1
    UC1 -.->|include| INC2
    UC1 -.->|include| INC3
    UC1 -.->|include| INC4
    UC2 -.->|include| INC1
```

---

## 4.1.5 Activity Diagram

### D.1 Activity - Analisis Teks (Mode ML)

```mermaid
flowchart TD
    classDef startEnd fill:#4CAF50,stroke:#2E7D32,stroke-width:2px,color:#fff
    classDef action fill:#E3F2FD,stroke:#1976D2,stroke-width:1px,color:#0D47A1
    classDef decision fill:#FFF3E0,stroke:#FF9800,stroke-width:2px,color:#E65100
    classDef error fill:#FFEBEE,stroke:#EF5350,stroke-width:1px,color:#C62828

    Start([Mulai]):::startEnd
    End1([Selesai]):::startEnd
    
    A1[Buka Halaman Analisis]:::action
    A2[Input Teks]:::action
    A3[Pilih Mode ML]:::action
    A4[Klik Analisis]:::action
    
    D1{Teks Kosong?}:::decision
    E1[Tampilkan Error]:::error
    
    A5[Kirim ke Flask API]:::action
    A6[Load Vectorizer]:::action
    A7[Transform TF-IDF]:::action
    A8[Load Model NB]:::action
    A9[Prediksi Sentimen]:::action
    A10[Hitung Probabilitas]:::action
    A11[Return Response]:::action
    
    D2{Response OK?}:::decision
    E2[Tampilkan Error Server]:::error
    
    A12[Render Result Card]:::action
    A13[Tampilkan Badge]:::action
    A14[Tampilkan Confidence]:::action
    A15[Simpan ke Riwayat]:::action
    
    Start --> A1
    A1 --> A2
    A2 --> A3
    A3 --> A4
    A4 --> D1
    
    D1 -->|Ya| E1
    E1 --> End1
    
    D1 -->|Tidak| A5
    A5 --> A6
    A6 --> A7
    A7 --> A8
    A8 --> A9
    A9 --> A10
    A10 --> A11
    A11 --> D2
    
    D2 -->|Error| E2
    E2 --> End1
    
    D2 -->|Sukses| A12
    A12 --> A13
    A13 --> A14
    A14 --> A15
    A15 --> End1
```

### D.2 Activity - Analisis URL (Mode LLM)

```mermaid
flowchart TD
    classDef startEnd fill:#4CAF50,stroke:#2E7D32,stroke-width:2px,color:#fff
    classDef action fill:#F3E5F5,stroke:#AB47BC,stroke-width:1px,color:#6A1B9A
    classDef decision fill:#FFF3E0,stroke:#FF9800,stroke-width:2px,color:#E65100
    classDef error fill:#FFEBEE,stroke:#EF5350,stroke-width:1px,color:#C62828

    Start([Mulai]):::startEnd
    End1([Selesai]):::startEnd
    
    A1[Input URL Berita]:::action
    A2[Pilih Mode LLM]:::action
    A3[Klik Ekstrak dan Analisis]:::action
    
    D1{URL Valid?}:::decision
    E1[Tampilkan Error URL]:::error
    
    A4[Invoke scrape-url]:::action
    A5[Firecrawl Ekstrak Konten]:::action
    
    D2{Scraping Berhasil?}:::decision
    E2[Tampilkan Error Scraping]:::error
    
    A6[Tampilkan Preview Konten]:::action
    A7[Invoke analyze-sentiment-llm]:::action
    A8[Kirim ke Lovable AI Gateway]:::action
    A9[Gemini Analisis Teks]:::action
    A10[Parse JSON Response]:::action
    
    D3{Analisis Berhasil?}:::decision
    E3[Tampilkan Error AI]:::error
    
    A11[Render Result Card]:::action
    A12[Tampilkan Reasoning]:::action
    A13[Simpan ke Riwayat]:::action
    
    Start --> A1
    A1 --> A2
    A2 --> A3
    A3 --> D1
    
    D1 -->|Tidak| E1
    E1 --> End1
    
    D1 -->|Ya| A4
    A4 --> A5
    A5 --> D2
    
    D2 -->|Tidak| E2
    E2 --> End1
    
    D2 -->|Ya| A6
    A6 --> A7
    A7 --> A8
    A8 --> A9
    A9 --> A10
    A10 --> D3
    
    D3 -->|Error| E3
    E3 --> End1
    
    D3 -->|Sukses| A11
    A11 --> A12
    A12 --> A13
    A13 --> End1
```

### D.3 Activity - Training Model

```mermaid
flowchart TD
    classDef startEnd fill:#4CAF50,stroke:#2E7D32,stroke-width:2px,color:#fff
    classDef action fill:#E8F5E9,stroke:#66BB6A,stroke-width:1px,color:#2E7D32
    classDef loop fill:#E1F5FE,stroke:#03A9F4,stroke-width:2px,color:#01579B
    classDef decision fill:#FFF3E0,stroke:#FF9800,stroke-width:2px,color:#E65100

    Start([Mulai]):::startEnd
    End1([Selesai]):::startEnd
    
    A1[Load data_sentimen.csv]:::action
    A2[Download NLTK Data]:::action
    
    subgraph Loop1["Loop Preprocessing"]
        L1[Ambil Baris Data]:::loop
        L2[Lowercase]:::loop
        L3[Hapus Karakter Khusus]:::loop
        L4[Tokenisasi]:::loop
        L5[Hapus Stopwords]:::loop
        L6[Normalisasi Slang]:::loop
        L7[Gabung Token]:::loop
        D1{Ada Baris Lagi?}:::decision
    end
    
    A3[Simpan data_bersih.csv]:::action
    A4[Inisialisasi TF-IDF]:::action
    A5[fit_transform X]:::action
    A6[train_test_split 80/20]:::action
    A7[Inisialisasi Naive Bayes]:::action
    A8[GridSearchCV alpha]:::action
    A9[5-Fold Cross Validation]:::action
    A10[Train dengan Best Params]:::action
    A11[Evaluasi Test Set]:::action
    A12[Simpan model_nb.pkl]:::action
    A13[Simpan vectorizer.pkl]:::action
    A14[Print Akurasi]:::action
    
    Start --> A1
    A1 --> A2
    A2 --> L1
    L1 --> L2
    L2 --> L3
    L3 --> L4
    L4 --> L5
    L5 --> L6
    L6 --> L7
    L7 --> D1
    D1 -->|Ya| L1
    D1 -->|Tidak| A3
    
    A3 --> A4
    A4 --> A5
    A5 --> A6
    A6 --> A7
    A7 --> A8
    A8 --> A9
    A9 --> A10
    A10 --> A11
    A11 --> A12
    A12 --> A13
    A13 --> A14
    A14 --> End1
```

### D.4 Activity - Dashboard Load

```mermaid
flowchart TD
    classDef startEnd fill:#4CAF50,stroke:#2E7D32,stroke-width:2px,color:#fff
    classDef action fill:#E3F2FD,stroke:#1976D2,stroke-width:1px,color:#0D47A1
    classDef parallel fill:#F3E5F5,stroke:#AB47BC,stroke-width:2px,color:#6A1B9A
    classDef decision fill:#FFF3E0,stroke:#FF9800,stroke-width:2px,color:#E65100
    classDef error fill:#FFEBEE,stroke:#EF5350,stroke-width:1px,color:#C62828

    Start([Mulai]):::startEnd
    End1([Selesai]):::startEnd
    
    A1[User Buka Dashboard]:::action
    A2[Set Loading True]:::action
    
    subgraph Parallel["Parallel API Calls"]
        P1[GET /api/stats]:::parallel
        P2[GET /api/mentions]:::parallel
        P3[GET /api/wordcloud]:::parallel
    end
    
    D1{Semua Berhasil?}:::decision
    E1[Tampilkan Error]:::error
    
    A3[Parse Response]:::action
    A4[Render Stat Cards]:::action
    A5[Render Sentiment Chart]:::action
    A6[Render Word Cloud]:::action
    A7[Render Mention Feed]:::action
    A8[Set Loading False]:::action
    
    Start --> A1
    A1 --> A2
    A2 --> P1
    A2 --> P2
    A2 --> P3
    P1 --> D1
    P2 --> D1
    P3 --> D1
    
    D1 -->|Error| E1
    E1 --> End1
    
    D1 -->|Sukses| A3
    A3 --> A4
    A4 --> A5
    A5 --> A6
    A6 --> A7
    A7 --> A8
    A8 --> End1
```

---

## 4.1.6 Sequence Diagram

### E.1 Sequence - Analisis Sentimen ML

```mermaid
sequenceDiagram
    autonumber
    
    actor U as Pengguna
    participant FE as Frontend
    participant API as Flask API
    participant VEC as TF-IDF
    participant NB as Naive Bayes
    
    U->>FE: Input teks
    U->>FE: Pilih mode ML
    U->>FE: Klik Analisis
    
    activate FE
    FE->>FE: Validasi input
    FE->>FE: Set loading
    
    FE->>+API: POST /api/analyze
    
    API->>+VEC: Load vectorizer
    VEC-->>-API: Ready
    
    API->>+VEC: transform(text)
    VEC-->>-API: TF-IDF Vector
    
    API->>+NB: Load model
    NB-->>-API: Ready
    
    API->>+NB: predict(vector)
    NB-->>-API: Label
    
    API->>+NB: predict_proba(vector)
    NB-->>-API: Probabilities
    
    API-->>-FE: JSON Response
    
    FE->>FE: Render ResultCard
    FE-->>U: Tampilkan hasil
    deactivate FE
```

### E.2 Sequence - Analisis Sentimen LLM

```mermaid
sequenceDiagram
    autonumber
    
    actor U as Pengguna
    participant FE as Frontend
    participant EF as Edge Function
    participant AI as AI Gateway
    participant LLM as Gemini
    
    U->>FE: Input teks
    U->>FE: Pilih mode LLM
    U->>FE: Klik Analisis
    
    activate FE
    FE->>FE: Validasi input
    
    FE->>+EF: POST /analyze-sentiment-llm
    
    EF->>EF: Truncate teks
    
    EF->>+AI: POST /v1/chat/completions
    
    AI->>+LLM: System + User Prompt
    LLM->>LLM: Analisis konteks
    LLM-->>-AI: JSON Response
    
    AI-->>-EF: AI Response
    
    EF->>EF: Parse JSON
    EF-->>-FE: Sentiment Result
    
    FE->>FE: Render ResultCard
    FE->>FE: Tampilkan Reasoning
    FE-->>U: Hasil + Penjelasan
    deactivate FE
```

### E.3 Sequence - Analisis URL Berita

```mermaid
sequenceDiagram
    autonumber
    
    actor U as Pengguna
    participant FE as Frontend
    participant SC as scrape-url
    participant FC as Firecrawl
    participant AN as analyze-llm
    participant AI as AI Gateway
    
    U->>FE: Input URL
    U->>FE: Klik Ekstrak
    
    activate FE
    
    FE->>+SC: POST /scrape-url
    SC->>+FC: POST /v1/scrape
    FC->>FC: Ekstrak konten
    FC-->>-SC: Markdown + Metadata
    SC-->>-FE: Content + Title
    
    FE->>FE: Preview konten
    
    FE->>+AN: POST /analyze-sentiment-llm
    AN->>+AI: Analisis sentimen
    AI-->>-AN: Hasil sentimen
    AN-->>-FE: Sentiment + Reasoning
    
    FE->>FE: Render ResultCard
    FE-->>U: Tampilkan hasil
    deactivate FE
```

### E.4 Sequence - Simpan Riwayat Analisis

```mermaid
sequenceDiagram
    autonumber
    
    actor U as Pengguna
    participant FE as Frontend
    participant Auth as Auth System
    participant DB as Database
    
    U->>FE: Selesai Analisis
    
    activate FE
    FE->>+Auth: Check session
    Auth-->>-FE: User authenticated
    
    FE->>FE: Siapkan data
    
    FE->>+DB: INSERT analysis_history
    Note over FE,DB: RLS: user_id = auth.uid()
    DB->>DB: Validasi RLS
    DB-->>-FE: Success
    
    FE->>FE: Update history list
    FE-->>U: Riwayat tersimpan
    deactivate FE
```

---

## Catatan Implementasi

### Skema Warna yang Digunakan

| Elemen | Warna | Kode Hex |
|--------|-------|----------|
| User/Actor | Biru Muda | #E8F4FD |
| Frontend | Biru | #E3F2FD |
| Backend | Hijau | #E8F5E9 |
| Cloud/LLM | Ungu | #F3E5F5 |
| Data Storage | Oranye | #FFF3E0 |
| External API | Merah Muda | #FFEBEE |
| Start/End | Hijau Solid | #4CAF50 |
| Decision | Oranye | #FFF3E0 |
| Error | Merah | #FFEBEE |

### Total Diagram: 14

| Kategori | Jumlah | Kode |
|----------|--------|------|
| Arsitektur Sistem | 2 | A.1, A.2 |
| ERD | 2 | B.1, B.2 |
| Use Case | 2 | C.1, C.2 |
| Activity Diagram | 4 | D.1, D.2, D.3, D.4 |
| Sequence Diagram | 4 | E.1, E.2, E.3, E.4 |

### Panduan Penggunaan

1. **Salin kode Mermaid** ke dalam dokumen Word atau LaTeX
2. **Render menggunakan**:
   - Mermaid Live Editor: https://mermaid.live/
   - VS Code Extension: Markdown Preview Mermaid Support
   - Export sebagai PNG/SVG untuk dokumen Word
3. **Sesuaikan ukuran** setelah di-render agar pas dengan margin A4
