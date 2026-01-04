"""
Preprocess screening data for ML training.

Steps:
    1. Load raw screening CSV
    2. Parse answer arrays
    3. Extract features (answer patterns, variance, etc.)
    4. Compute target labels from scores
    5. Train/test split (stratified)
    6. Save to processed/
"""

import pandas as pd
import numpy as np
import json
from pathlib import Path
from sklearn.model_selection import train_test_split


def parse_answers(answer_str):
    """Parse answer string back to list of integers"""
    try:
        # Remove brackets and split
        answers = json.loads(answer_str.replace("'", '"'))
        return answers
    except:
        return []


def extract_features(df):
    """Extract features from screening answers"""
    features_list = []
    
    for idx, row in df.iterrows():
        answers = parse_answers(row['answers'])
        
        if len(answers) == 0:
            continue
        
        # Basic features
        features = {
            'score': row['score'],
            'type': row['type'],
        }
        
        # Individual answer features (PHQ-9 has 9 questions, GAD-7 has 7)
        for i, ans in enumerate(answers):
            features[f'q{i+1}'] = ans
        
        # Derived features
        features['sum_score'] = sum(answers)
        features['mean_score'] = np.mean(answers)
        features['std_score'] = np.std(answers)
        features['max_score'] = max(answers)
        features['min_score'] = min(answers)
        features['range_score'] = max(answers) - min(answers)
        features['num_zeros'] = sum(1 for a in answers if a == 0)
        features['num_threes'] = sum(1 for a in answers if a == 3)
        
        # Target label (risk level)
        features['risk_level'] = row['risk_level']
        
        features_list.append(features)
    
    return pd.DataFrame(features_list)


def create_severity_labels(df):
    """
    Map scores to severity labels using clinical guidelines.
    
    PHQ-9: 0-4 (none), 5-9 (mild), 10-14 (moderate), 15-19 (moderately severe), 20-27 (severe)
    GAD-7: 0-4 (none), 5-9 (mild), 10-14 (moderate), 15-21 (severe)
    """
    def label_phq9(score):
        if score <= 4:
            return 0  # none
        elif score <= 9:
            return 1  # mild
        elif score <= 14:
            return 2  # moderate
        elif score <= 19:
            return 3  # moderately severe
        else:
            return 4  # severe
    
    def label_gad7(score):
        if score <= 4:
            return 0  # none
        elif score <= 9:
            return 1  # mild
        elif score <= 14:
            return 2  # moderate
        else:
            return 3  # severe
    
    df['severity_label'] = df.apply(
        lambda row: label_phq9(row['score']) if row['type'] == 'PHQ9' else label_gad7(row['score']),
        axis=1
    )
    
    return df


def main():
    # Paths - resolve relative to script location
    script_dir = Path(__file__).parent
    raw_dir = script_dir.parent / 'data' / 'raw'
    processed_dir = script_dir.parent / 'data' / 'processed'
    processed_dir.mkdir(parents=True, exist_ok=True)
    
    # Load raw data
    print("Loading raw screening data...")
    screenings_file = raw_dir / 'screenings.csv'
    if not screenings_file.exists():
        # Try synthetic data
        screenings_file = raw_dir / 'synthetic_screenings.csv'
    
    if not screenings_file.exists():
        print(f"❌ No screening data found in {raw_dir}")
        print("Run generate_synthetic_data.py first!")
        return
    
    df = pd.read_csv(screenings_file)
    print(f"Loaded {len(df)} records")
    
    # Extract features
    print("Extracting features...")
    df_features = extract_features(df)
    
    # Create severity labels
    print("Creating severity labels...")
    df_features = create_severity_labels(df_features)
    
    # Split by screening type
    df_phq9 = df_features[df_features['type'] == 'PHQ9'].copy()
    df_gad7 = df_features[df_features['type'] == 'GAD7'].copy()
    
    print(f"PHQ-9: {len(df_phq9)} records")
    print(f"GAD-7: {len(df_gad7)} records")
    
    # Train/test split for each type (stratified by severity)
    if len(df_phq9) > 0:
        X_phq9 = df_phq9.drop(['type', 'risk_level', 'severity_label'], axis=1)
        y_phq9 = df_phq9['severity_label']
        
        if len(df_phq9) >= 10:  # Minimum for split
            X_train_phq9, X_test_phq9, y_train_phq9, y_test_phq9 = train_test_split(
                X_phq9, y_phq9, test_size=0.2, stratify=y_phq9, random_state=42
            )
            
            # Save
            train_phq9 = pd.concat([X_train_phq9, y_train_phq9], axis=1)
            test_phq9 = pd.concat([X_test_phq9, y_test_phq9], axis=1)
            
            train_phq9.to_csv(processed_dir / 'train_phq9.csv', index=False)
            test_phq9.to_csv(processed_dir / 'test_phq9.csv', index=False)
            
            print(f"PHQ-9 train: {len(train_phq9)}, test: {len(test_phq9)}")
    
    if len(df_gad7) > 0:
        X_gad7 = df_gad7.drop(['type', 'risk_level', 'severity_label'], axis=1)
        y_gad7 = df_gad7['severity_label']
        
        if len(df_gad7) >= 10:
            X_train_gad7, X_test_gad7, y_train_gad7, y_test_gad7 = train_test_split(
                X_gad7, y_gad7, test_size=0.2, stratify=y_gad7, random_state=42
            )
            
            # Save
            train_gad7 = pd.concat([X_train_gad7, y_train_gad7], axis=1)
            test_gad7 = pd.concat([X_test_gad7, y_test_gad7], axis=1)
            
            train_gad7.to_csv(processed_dir / 'train_gad7.csv', index=False)
            test_gad7.to_csv(processed_dir / 'test_gad7.csv', index=False)
            
            print(f"GAD-7 train: {len(train_gad7)}, test: {len(test_gad7)}")
    
    print(f"\n✅ Preprocessing complete! Data saved to {processed_dir.absolute()}")


if __name__ == '__main__':
    main()
