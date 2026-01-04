"""
Generate synthetic screening data for ML training.

Uses clinical guidelines to create realistic PHQ-9 and GAD-7 responses with noise.

Usage:
    python generate_synthetic_data.py --n-samples 5000 --output data/raw/synthetic_screenings.csv
"""

import pandas as pd
import numpy as np
from pathlib import Path
import argparse
from datetime import datetime, timedelta

# PHQ-9 and GAD-7 clinical guidelines for severity mapping
PHQ9_THRESHOLDS = {
    'none': (0, 4),
    'mild': (5, 9),
    'moderate': (10, 14),
    'moderately-severe': (15, 19),
    'severe': (20, 27)
}

GAD7_THRESHOLDS = {
    'none': (0, 4),
    'mild': (5, 9),
    'moderate': (10, 14),
    'severe': (15, 21)
}


def generate_phq9_answers(severity_level):
    """
    Generate realistic PHQ-9 answers for a given severity level.
    
    PHQ-9 has 9 questions, each scored 0-3.
    """
    min_score, max_score = PHQ9_THRESHOLDS[severity_level]
    
    # Target score within the range
    target_score = np.random.randint(min_score, max_score + 1)
    
    # Distribute score across 9 questions with realistic patterns
    answers = []
    remaining = target_score
    
    for i in range(9):
        if i == 8:  # Last question
            answers.append(min(3, remaining))
        else:
            # Add some variance but stay realistic
            if severity_level == 'none':
                max_val = min(1, remaining)
            elif severity_level == 'mild':
                max_val = min(2, remaining)
            else:
                max_val = min(3, remaining)
            
            ans = np.random.randint(0, max_val + 1)
            answers.append(ans)
            remaining -= ans
    
    # Shuffle to avoid patterns
    np.random.shuffle(answers)
    
    # Ensure we hit the target score
    current_sum = sum(answers)
    if current_sum < target_score:
        diff = target_score - current_sum
        for i in range(diff):
            idx = np.random.randint(0, 9)
            if answers[idx] < 3:
                answers[idx] += 1
    
    return answers


def generate_gad7_answers(severity_level):
    """
    Generate realistic GAD-7 answers for a given severity level.
    
    GAD-7 has 7 questions, each scored 0-3.
    """
    min_score, max_score = GAD7_THRESHOLDS[severity_level]
    
    target_score = np.random.randint(min_score, max_score + 1)
    
    answers = []
    remaining = target_score
    
    for i in range(7):
        if i == 6:
            answers.append(min(3, remaining))
        else:
            if severity_level == 'none':
                max_val = min(1, remaining)
            elif severity_level == 'mild':
                max_val = min(2, remaining)
            else:
                max_val = min(3, remaining)
            
            ans = np.random.randint(0, max_val + 1)
            answers.append(ans)
            remaining -= ans
    
    np.random.shuffle(answers)
    
    current_sum = sum(answers)
    if current_sum < target_score:
        diff = target_score - current_sum
        for i in range(diff):
            idx = np.random.randint(0, 7)
            if answers[idx] < 3:
                answers[idx] += 1
    
    return answers


def generate_synthetic_dataset(n_samples=5000, phq9_ratio=0.5):
    """
    Generate synthetic screening dataset.
    
    Args:
        n_samples: Total number of samples to generate
        phq9_ratio: Ratio of PHQ-9 vs GAD-7 (0.5 = equal split)
    
    Returns:
        pandas DataFrame
    """
    records = []
    
    n_phq9 = int(n_samples * phq9_ratio)
    n_gad7 = n_samples - n_phq9
    
    # Generate PHQ-9 samples
    print(f"Generating {n_phq9} PHQ-9 samples...")
    severity_distribution = {
        'none': 0.30,
        'mild': 0.30,
        'moderate': 0.20,
        'moderately-severe': 0.15,
        'severe': 0.05
    }
    
    for i in range(n_phq9):
        severity = np.random.choice(
            list(severity_distribution.keys()),
            p=list(severity_distribution.values())
        )
        
        answers = generate_phq9_answers(severity)
        score = sum(answers)
        
        record = {
            'user_hash': f"synth_phq9_{i:05d}",
            'type': 'PHQ9',
            'score': score,
            'answers': str(answers),
            'risk_level': severity,
            'timestamp': datetime.now() - timedelta(days=np.random.randint(0, 365))
        }
        records.append(record)
    
    # Generate GAD-7 samples
    print(f"Generating {n_gad7} GAD-7 samples...")
    severity_distribution_gad = {
        'none': 0.35,
        'mild': 0.30,
        'moderate': 0.25,
        'severe': 0.10
    }
    
    for i in range(n_gad7):
        severity = np.random.choice(
            list(severity_distribution_gad.keys()),
            p=list(severity_distribution_gad.values())
        )
        
        answers = generate_gad7_answers(severity)
        score = sum(answers)
        
        record = {
            'user_hash': f"synth_gad7_{i:05d}",
            'type': 'GAD7',
            'score': score,
            'answers': str(answers),
            'risk_level': severity,
            'timestamp': datetime.now() - timedelta(days=np.random.randint(0, 365))
        }
        records.append(record)
    
    df = pd.DataFrame(records)
    
    # Shuffle
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    return df


def main():
    parser = argparse.ArgumentParser(description='Generate synthetic screening data')
    parser.add_argument('--n-samples', type=int, default=5000, help='Number of samples to generate')
    parser.add_argument('--phq9-ratio', type=float, default=0.5, help='Ratio of PHQ-9 samples')
    parser.add_argument('--output', default='data/raw/synthetic_screenings.csv', help='Output file path')
    parser.add_argument('--seed', type=int, default=42, help='Random seed')
    
    args = parser.parse_args()
    
    # Set seed
    np.random.seed(args.seed)
    
    # Generate data
    print(f"Generating {args.n_samples} synthetic screening samples...")
    df = generate_synthetic_dataset(args.n_samples, args.phq9_ratio)
    
    # Save
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)
    
    print(f"\n✅ Generated {len(df)} samples")
    print(f"Saved to: {output_path.absolute()}")
    print(f"\nBreakdown:")
    print(df.groupby(['type', 'risk_level']).size())


if __name__ == '__main__':
    main()
