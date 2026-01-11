import pandas as pd
import pickle
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.svm import LinearSVC
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV, StratifiedKFold
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report
import os
import warnings

warnings.filterwarnings('ignore')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def print_separator(title=""):
    """Print a separator line with optional title"""
    print("\n" + "=" * 60)
    if title:
        print(f"  {title}")
        print("=" * 60)

def evaluate_model(model, X_test, y_test, model_name="Model"):
    """Evaluate model and return metrics"""
    y_pred = model.predict(X_test)
    
    metrics = {
        'accuracy': accuracy_score(y_test, y_pred),
        'precision': precision_score(y_test, y_pred, average='weighted', zero_division=0),
        'recall': recall_score(y_test, y_pred, average='weighted', zero_division=0),
        'f1': f1_score(y_test, y_pred, average='weighted', zero_division=0)
    }
    
    return metrics, y_pred

def main():
    print_separator("TRAINING PIPELINE - Sistem Analisis Sentimen PIM")
    
    # ====== LOAD DATA ======
    print("\n📂 Loading data...")
    data = pd.read_csv(os.path.join(BASE_DIR, 'data/data_bersih.csv'))
    
    # Remove empty clean_text
    data = data[data['clean_text'].notna() & (data['clean_text'] != '')]
    
    print(f"   • Total data: {len(data)} baris")
    print(f"   • Distribusi label:")
    for label, count in data['label'].value_counts().items():
        print(f"     - {label}: {count} ({count/len(data)*100:.1f}%)")
    
    X = data['clean_text']
    y = data['label']
    
    # ====== TF-IDF VECTORIZATION (IMPROVED) ======
    print_separator("TF-IDF Vectorization (Improved)")
    
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),      # Unigram + Bigram untuk konteks
        max_features=5000,        # Limit fitur untuk mencegah overfitting
        min_df=2,                 # Minimal muncul di 2 dokumen
        max_df=0.95,              # Maksimal 95% dokumen (exclude terlalu umum)
        sublinear_tf=True,        # Gunakan 1 + log(tf) untuk mengurangi dominasi kata frequent
        strip_accents='unicode',  # Handle aksen
        lowercase=True,           # Lowercase (redundant tapi safety)
        token_pattern=r'\b\w+\b'  # Word boundary tokenization
    )
    
    X_vector = vectorizer.fit_transform(X)
    
    print(f"   • Vocabulary size: {len(vectorizer.vocabulary_)} fitur")
    print(f"   • Matrix shape: {X_vector.shape}")
    print(f"   • Sparsity: {(1 - X_vector.nnz / (X_vector.shape[0] * X_vector.shape[1])) * 100:.2f}%")
    
    # Show top features
    feature_names = vectorizer.get_feature_names_out()
    print(f"\n   📝 Sample fitur (first 20):")
    print(f"      {', '.join(feature_names[:20])}")
    
    # ====== TRAIN/TEST SPLIT ======
    print_separator("Train/Test Split")
    
    X_train, X_test, y_train, y_test = train_test_split(
        X_vector, y, 
        test_size=0.2, 
        random_state=42,
        stratify=y  # Stratified split untuk balance
    )
    
    print(f"   • Train set: {X_train.shape[0]} samples")
    print(f"   • Test set: {X_test.shape[0]} samples")
    
    # ====== CROSS-VALIDATION COMPARISON ======
    print_separator("Model Comparison (5-Fold Cross-Validation)")
    
    models = {
        'Naive Bayes': MultinomialNB(alpha=0.1),
        'SVM (LinearSVC)': LinearSVC(C=1.0, max_iter=5000, random_state=42),
        'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42)
    }
    
    cv_results = {}
    
    for name, model in models.items():
        print(f"\n   🔄 {name}...")
        
        # Cross-validation
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        scores = cross_val_score(model, X_train, y_train, cv=cv, scoring='f1_weighted')
        
        cv_results[name] = {
            'mean': scores.mean(),
            'std': scores.std(),
            'scores': scores
        }
        
        print(f"      CV F1-Score: {scores.mean():.4f} (+/- {scores.std()*2:.4f})")
    
    # ====== HYPERPARAMETER TUNING (Naive Bayes) ======
    print_separator("Hyperparameter Tuning - Naive Bayes")
    
    param_grid = {
        'alpha': [0.001, 0.01, 0.05, 0.1, 0.5, 1.0, 2.0, 5.0]
    }
    
    nb_model = MultinomialNB()
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    
    grid_search = GridSearchCV(
        nb_model, 
        param_grid, 
        cv=cv, 
        scoring='f1_weighted',
        n_jobs=-1,
        verbose=0
    )
    
    print("   ⏳ Running GridSearchCV...")
    grid_search.fit(X_train, y_train)
    
    print(f"\n   📊 Results for each alpha:")
    for mean, std, params in zip(
        grid_search.cv_results_['mean_test_score'],
        grid_search.cv_results_['std_test_score'],
        grid_search.cv_results_['params']
    ):
        print(f"      alpha={params['alpha']:<6} -> F1: {mean:.4f} (+/- {std*2:.4f})")
    
    print(f"\n   ✅ Best parameters: {grid_search.best_params_}")
    print(f"   ✅ Best CV F1-Score: {grid_search.best_score_:.4f}")
    
    best_nb = grid_search.best_estimator_
    
    # ====== FINAL MODEL EVALUATION ======
    print_separator("Final Model Evaluation on Test Set")
    
    # Train best model on full training set
    best_nb.fit(X_train, y_train)
    
    metrics, y_pred = evaluate_model(best_nb, X_test, y_test, "Naive Bayes (Tuned)")
    
    print(f"\n   📈 Performance Metrics:")
    print(f"      • Accuracy:  {metrics['accuracy']:.4f} ({metrics['accuracy']*100:.2f}%)")
    print(f"      • Precision: {metrics['precision']:.4f}")
    print(f"      • Recall:    {metrics['recall']:.4f}")
    print(f"      • F1-Score:  {metrics['f1']:.4f}")
    
    print(f"\n   📋 Classification Report:")
    print("-" * 50)
    print(classification_report(y_test, y_pred))
    
    # ====== COMPARE WITH OTHER MODELS ON TEST SET ======
    print_separator("Test Set Comparison - All Models")
    
    all_results = {}
    
    for name, model in models.items():
        model.fit(X_train, y_train)
        metrics_tmp, _ = evaluate_model(model, X_test, y_test, name)
        all_results[name] = metrics_tmp
        print(f"\n   {name}:")
        print(f"      Accuracy: {metrics_tmp['accuracy']:.4f} | F1: {metrics_tmp['f1']:.4f}")
    
    # Find best model
    best_model_name = max(all_results.keys(), key=lambda k: all_results[k]['f1'])
    print(f"\n   🏆 Best Model: {best_model_name} (F1: {all_results[best_model_name]['f1']:.4f})")
    
    # ====== SAVE MODEL AND VECTORIZER ======
    print_separator("Saving Model & Vectorizer")
    
    model_dir = os.path.join(BASE_DIR, 'model')
    os.makedirs(model_dir, exist_ok=True)
    
    # Save the tuned Naive Bayes model (most consistent for text classification)
    model_path = os.path.join(model_dir, 'model_nb.pkl')
    vectorizer_path = os.path.join(model_dir, 'vectorizer.pkl')
    
    pickle.dump(best_nb, open(model_path, 'wb'))
    pickle.dump(vectorizer, open(vectorizer_path, 'wb'))
    
    print(f"   📁 Model saved: {model_path}")
    print(f"   📁 Vectorizer saved: {vectorizer_path}")
    
    # ====== SUMMARY ======
    print_separator("TRAINING SUMMARY")
    
    print(f"""
   📊 Dataset:
      • Total samples: {len(data)}
      • Train/Test split: 80/20
      • Stratified: Yes
   
   🔧 Vectorizer (TF-IDF):
      • N-grams: (1, 2) unigram + bigram
      • Max features: 5000
      • Min DF: 2, Max DF: 0.95
      • Sublinear TF: Yes
   
   🤖 Model (Naive Bayes):
      • Alpha (smoothing): {grid_search.best_params_['alpha']}
      • Final Test Accuracy: {metrics['accuracy']*100:.2f}%
      • Final Test F1-Score: {metrics['f1']:.4f}
   
   📂 Output:
      • {model_path}
      • {vectorizer_path}
    """)
    
    print("=" * 60)
    print("   ✅ TRAINING COMPLETED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    main()
