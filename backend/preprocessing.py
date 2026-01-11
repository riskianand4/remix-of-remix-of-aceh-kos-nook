import pandas as pd
import re
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import os

# Download NLTK data
nltk.download('punkt')
nltk.download('stopwords')
nltk.download('punkt_tab')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ====== SLANG DICTIONARY ======
# Kamus normalisasi kata gaul/slang Indonesia
slang_dict = {
    # Negasi
    'gak': 'tidak', 'ga': 'tidak', 'gk': 'tidak', 'tdk': 'tidak',
    'nggak': 'tidak', 'ngga': 'tidak', 'g': 'tidak', 'gx': 'tidak',
    'kagak': 'tidak', 'kaga': 'tidak', 'tak': 'tidak', 'ndak': 'tidak',
    'enggak': 'tidak', 'engga': 'tidak',
    
    # Kata penghubung
    'yg': 'yang', 'dgn': 'dengan', 'utk': 'untuk', 'krn': 'karena',
    'krna': 'karena', 'karna': 'karena', 'dg': 'dengan', 'dr': 'dari',
    'pd': 'pada', 'kpd': 'kepada', 'sbg': 'sebagai', 'ttg': 'tentang',
    'spy': 'supaya', 'biar': 'supaya', 'agar': 'supaya',
    'tp': 'tapi', 'tetapi': 'tapi', 'namun': 'tapi',
    
    # Kata sifat positif
    'bgus': 'bagus', 'bgs': 'bagus', 'mantap': 'bagus', 'mantab': 'bagus',
    'mantep': 'bagus', 'mantul': 'bagus', 'keren': 'bagus', 'top': 'bagus',
    'oke': 'bagus', 'ok': 'bagus', 'okey': 'bagus', 'sip': 'bagus',
    'jos': 'bagus', 'josss': 'bagus', 'joss': 'bagus', 'cakep': 'bagus',
    'cucok': 'bagus', 'cucuk': 'bagus', 'cocok': 'sesuai',
    'recommended': 'rekomendasi', 'rekomen': 'rekomendasi',
    'puas': 'senang', 'seneng': 'senang', 'suka': 'senang',
    'asik': 'menyenangkan', 'asyik': 'menyenangkan',
    
    # Kata sifat negatif
    'jlek': 'jelek', 'jlk': 'jelek', 'ancur': 'buruk', 'hancur': 'buruk',
    'parah': 'buruk', 'parahh': 'buruk', 'ampas': 'buruk', 'sampah': 'buruk',
    'zonk': 'buruk', 'gagal': 'buruk', 'mengecewakan': 'kecewa',
    'kecewaa': 'kecewa', 'kapok': 'kecewa', 'nyesel': 'menyesal',
    'nysel': 'menyesal', 'rugi': 'rugi', 'bosen': 'bosan',
    'males': 'malas', 'mls': 'malas', 'ribet': 'rumit', 'rbet': 'rumit',
    
    # Intensifier
    'bgt': 'sangat', 'banget': 'sangat', 'bngt': 'sangat', 'bngtt': 'sangat',
    'poll': 'sangat', 'pol': 'sangat', 'skali': 'sekali', 'sgt': 'sangat',
    'sngat': 'sangat', 'amat': 'sangat', 'terlalu': 'sangat',
    
    # Pronoun
    'gw': 'saya', 'gue': 'saya', 'gua': 'saya', 'aku': 'saya', 'sy': 'saya',
    'ane': 'saya', 'lo': 'kamu', 'lu': 'kamu', 'loe': 'kamu', 'elu': 'kamu',
    'km': 'kamu', 'kmu': 'kamu', 'ente': 'kamu',
    
    # Kata kerja
    'blm': 'belum', 'udh': 'sudah', 'udah': 'sudah', 'sdh': 'sudah',
    'dah': 'sudah', 'uda': 'sudah', 'lg': 'lagi', 'lgi': 'lagi',
    'bs': 'bisa', 'bsa': 'bisa', 'gbs': 'tidak bisa', 'gabisa': 'tidak bisa',
    'bs': 'bisa', 'jd': 'jadi', 'jdi': 'jadi', 'mw': 'mau', 'mo': 'mau',
    'msh': 'masih', 'masi': 'masih', 'msih': 'masih',
    'dpt': 'dapat', 'bkin': 'buat', 'bikin': 'buat', 'mkn': 'makan',
    'mnum': 'minum', 'pke': 'pakai', 'pake': 'pakai',
    
    # Pupuk/Pertanian related
    'pupuknya': 'pupuk', 'tanamannya': 'tanaman', 'hasil': 'hasil',
    'panen': 'panen', 'tumbuh': 'tumbuh', 'subur': 'subur',
    
    # Misc
    'emg': 'memang', 'emang': 'memang', 'mmg': 'memang',
    'gmn': 'bagaimana', 'gimana': 'bagaimana', 'gmna': 'bagaimana',
    'dmn': 'dimana', 'dimana': 'dimana', 'dmna': 'dimana',
    'knp': 'kenapa', 'knapa': 'kenapa', 'napa': 'kenapa',
    'kpn': 'kapan', 'kapn': 'kapan',
    'org': 'orang', 'orng': 'orang', 'byk': 'banyak', 'bnyk': 'banyak',
    'sdikit': 'sedikit', 'sdkit': 'sedikit', 'dkit': 'sedikit',
    'krg': 'kurang', 'kurg': 'kurang', 'brg': 'barang', 'brng': 'barang',
    'hrg': 'harga', 'hrgnya': 'harga', 'harganya': 'harga',
    'mhl': 'mahal', 'murah': 'murah', 'mrh': 'murah',
    'trus': 'terus', 'trs': 'terus', 'kmrn': 'kemarin', 'bsk': 'besok',
    'skrg': 'sekarang', 'skr': 'sekarang', 'skg': 'sekarang',
    'bln': 'bulan', 'thn': 'tahun', 'th': 'tahun',
    'info': 'informasi', 'sy': 'saya', 'thx': 'terima kasih',
    'thanks': 'terima kasih', 'makasih': 'terima kasih', 'mksh': 'terima kasih',
    'tq': 'terima kasih', 'tyvm': 'terima kasih',
}

# ====== PREPROCESSING FUNCTIONS ======

def normalize_repeated_chars(text):
    """Normalize repeated characters: baguuuus -> bagus, hahaha -> ha"""
    # Reduce 3+ same chars to 2
    text = re.sub(r'(.)\1{2,}', r'\1\1', text)
    # Common laugh patterns
    text = re.sub(r'(ha){2,}', 'ha', text)
    text = re.sub(r'(he){2,}', 'he', text)
    text = re.sub(r'(hi){2,}', 'hi', text)
    text = re.sub(r'(wk){2,}', 'wk', text)
    text = re.sub(r'(xi){2,}', 'xi', text)
    return text

def remove_urls(text):
    """Remove URLs from text"""
    # HTTP/HTTPS URLs
    text = re.sub(r'https?://\S+', '', text)
    # www URLs
    text = re.sub(r'www\.\S+', '', text)
    return text

def remove_mentions_hashtags(text):
    """Remove @mentions and #hashtags"""
    text = re.sub(r'@\w+', '', text)
    text = re.sub(r'#\w+', '', text)
    return text

def remove_emojis(text):
    """Remove emojis and emoticons"""
    # Emoji pattern
    emoji_pattern = re.compile(
        "["
        "\U0001F600-\U0001F64F"  # emoticons
        "\U0001F300-\U0001F5FF"  # symbols & pictographs
        "\U0001F680-\U0001F6FF"  # transport & map symbols
        "\U0001F1E0-\U0001F1FF"  # flags
        "\U00002702-\U000027B0"  # dingbats
        "\U000024C2-\U0001F251"  # misc
        "]+", 
        flags=re.UNICODE
    )
    text = emoji_pattern.sub('', text)
    
    # Common text emoticons
    emoticons = [
        ':)', ':(', ':D', ':P', ':p', ';)', ';D', ':/', ':\\', 
        ':-)', ':-(', ':-D', ':-P', ':-p', ';-)', ';-D', ':-/', ':-\\',
        ':3', ':o', ':O', 'xD', 'XD', '<3', '</3', ':*', ':-*',
        '^^', '^_^', '-_-', 'T_T', 'T.T', '>_<', '>.<', 'o_o', 'O_O',
    ]
    for emoticon in emoticons:
        text = text.replace(emoticon, '')
    
    return text

def normalize_slang(text, slang_dictionary):
    """Replace slang words with standard Indonesian"""
    words = text.split()
    normalized = []
    for word in words:
        # Check if word is in slang dictionary
        normalized_word = slang_dictionary.get(word.lower(), word)
        normalized.append(normalized_word)
    return ' '.join(normalized)

def remove_numbers(text):
    """Remove standalone numbers but keep numbers attached to words"""
    text = re.sub(r'\b\d+\b', '', text)
    return text

def remove_extra_whitespace(text):
    """Remove extra whitespace"""
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def preprocess(text):
    """
    Advanced preprocessing pipeline for Indonesian text sentiment analysis
    
    Steps:
    1. Lowercase
    2. Remove URLs
    3. Remove mentions and hashtags
    4. Remove emojis
    5. Normalize repeated characters
    6. Remove special characters (keep alphanumeric and space)
    7. Remove standalone numbers
    8. Normalize slang words
    9. Tokenization
    10. Remove stopwords
    11. Remove extra whitespace
    """
    if pd.isna(text) or not isinstance(text, str):
        return ''
    
    # Step 1: Lowercase
    text = text.lower()
    
    # Step 2: Remove URLs
    text = remove_urls(text)
    
    # Step 3: Remove mentions and hashtags
    text = remove_mentions_hashtags(text)
    
    # Step 4: Remove emojis
    text = remove_emojis(text)
    
    # Step 5: Normalize repeated characters
    text = normalize_repeated_chars(text)
    
    # Step 6: Remove special characters (keep only letters, numbers, and space)
    text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)
    
    # Step 7: Remove standalone numbers
    text = remove_numbers(text)
    
    # Step 8: Normalize slang words
    text = normalize_slang(text, slang_dict)
    
    # Step 9: Tokenization
    tokens = word_tokenize(text)
    
    # Step 10: Remove stopwords
    stop_words = set(stopwords.words('indonesian'))
    # Add custom stopwords
    custom_stopwords = {
        'yg', 'nya', 'kalo', 'kl', 'aja', 'sih', 'dong', 'deh', 'nih', 'loh',
        'kan', 'ya', 'lah', 'tuh', 'mah', 'gitu', 'gini', 'kok', 'emang',
        'banget', 'bgt', 'pim', 'pupuk', 'iskandar', 'muda', 'pt'  # Domain-specific
    }
    stop_words.update(custom_stopwords)
    tokens = [t for t in tokens if t not in stop_words and len(t) > 1]
    
    # Step 11: Join and remove extra whitespace
    result = ' '.join(tokens)
    result = remove_extra_whitespace(result)
    
    return result

# ====== MAIN EXECUTION ======

if __name__ == "__main__":
    # Load data
    data = pd.read_csv(os.path.join(BASE_DIR, 'data/data_sentimen.csv'))
    
    print("=" * 60)
    print("PREPROCESSING PIPELINE - Sistem Analisis Sentimen PIM")
    print("=" * 60)
    print(f"\n📂 Data loaded: {len(data)} baris")
    print(f"📊 Kolom: {list(data.columns)}")
    
    # Show sample before preprocessing
    print("\n📝 Sample data SEBELUM preprocessing:")
    print("-" * 40)
    for i, row in data.head(3).iterrows():
        print(f"   [{i}] {row['teks'][:80]}...")
    
    # Apply preprocessing
    print("\n⏳ Menjalankan preprocessing...")
    data['clean_text'] = data['teks'].apply(preprocess)
    
    # Show sample after preprocessing
    print("\n✅ Sample data SETELAH preprocessing:")
    print("-" * 40)
    for i, row in data.head(3).iterrows():
        print(f"   [{i}] {row['clean_text'][:80]}...")
    
    # Statistics
    print("\n📊 Statistik Preprocessing:")
    print("-" * 40)
    avg_orig = data['teks'].str.len().mean()
    avg_clean = data['clean_text'].str.len().mean()
    print(f"   • Rata-rata panjang teks asli: {avg_orig:.1f} karakter")
    print(f"   • Rata-rata panjang teks bersih: {avg_clean:.1f} karakter")
    print(f"   • Reduksi: {((avg_orig - avg_clean) / avg_orig * 100):.1f}%")
    
    # Empty text warning
    empty_count = (data['clean_text'] == '').sum()
    if empty_count > 0:
        print(f"\n⚠️  Warning: {empty_count} baris menghasilkan teks kosong setelah preprocessing")
    
    # Save results
    output_path = os.path.join(BASE_DIR, 'data/data_bersih.csv')
    data.to_csv(output_path, index=False)
    
    print("\n" + "=" * 60)
    print(f"✅ Preprocessing selesai!")
    print(f"📁 File disimpan di: {output_path}")
    print(f"📊 Total data: {len(data)} baris")
    print("=" * 60)
