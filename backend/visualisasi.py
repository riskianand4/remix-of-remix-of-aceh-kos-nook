import pandas as pd
import matplotlib.pyplot as plt
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load data
data = pd.read_csv(os.path.join(BASE_DIR, 'data/data_sentimen.csv'))

# Hitung distribusi sentimen
sentiment_counts = data['label'].value_counts()

# Visualisasi pie chart
plt.figure(figsize=(10, 6))

plt.subplot(1, 2, 1)
colors = ['#22c55e', '#eab308', '#ef4444']  # hijau, kuning, merah
plt.pie(sentiment_counts, labels=sentiment_counts.index, autopct='%1.1f%%', colors=colors)
plt.title('Distribusi Sentimen')

# Visualisasi bar chart
plt.subplot(1, 2, 2)
bars = plt.bar(sentiment_counts.index, sentiment_counts.values, color=colors)
plt.title('Jumlah per Kategori Sentimen')
plt.xlabel('Sentimen')
plt.ylabel('Jumlah')

# Tambahkan label di atas bar
for bar, count in zip(bars, sentiment_counts.values):
    plt.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1, 
             str(count), ha='center', va='bottom')

plt.tight_layout()
plt.savefig(os.path.join(BASE_DIR, 'sentiment_visualization.png'), dpi=150)
plt.show()

print(f"\nDistribusi Sentimen:")
for label, count in sentiment_counts.items():
    print(f"  {label}: {count} ({count/len(data)*100:.1f}%)")
