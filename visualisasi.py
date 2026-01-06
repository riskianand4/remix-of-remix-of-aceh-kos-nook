import pandas as pd
import matplotlib.pyplot as plt

data = pd.read_csv('data/data_bersih.csv')

data['label'].value_counts().plot(kind='bar')
plt.title('Distribusi Sentimen Publik')
plt.xlabel('Sentimen')
plt.ylabel('Jumlah')
plt.show()
