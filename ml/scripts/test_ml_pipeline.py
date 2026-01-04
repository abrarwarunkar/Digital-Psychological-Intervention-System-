"""
End-to-end test for Sprint 7 ML pipeline.

Tests:
    1. Synthetic data generation
    2. Preprocessing
    3. Model training
    4. Model evaluation
    5. Model serving

Usage:
    python test_ml_pipeline.py
"""

import subprocess
import sys
from pathlib import Path
import json


def run_command(cmd, cwd=None):
    """Run shell command and return success"""
    print(f"\n{'='*60}")
    print(f"Running: {' '.join(cmd)}")
    print(f"{'='*60}")
    
    result = subprocess.run(cmd, cwd=cwd, capture_output=False)
    
    if result.returncode == 0:
        print("✅ Success")
        return True
    else:
        print(f"❌ Failed with code {result.returncode}")
        return False


def main():
    ml_dir = Path(__file__).parent.parent
    scripts_dir = ml_dir / 'scripts'
    
    print("\n" + "="*60)
    print("SPRINT 7 ML PIPELINE - END-TO-END TEST")
    print("="*60)
    
    tests_passed = []
    tests_failed = []
    
    # Test 1: Generate synthetic data
    print("\n[1/5] Generating synthetic data...")
    if run_command([
        sys.executable,
        'generate_synthetic_data.py',
        '--n-samples', '1000',
        '--output', '../data/raw/synthetic_screenings.csv'
    ], cwd=scripts_dir):
        tests_passed.append("Synthetic data generation")
    else:
        tests_failed.append("Synthetic data generation")
        print("\n⚠️  Pipeline stopped due to failure")
        return False
    
    # Test 2: Preprocess data
    print("\n[2/5] Preprocessing data...")
    if run_command([
        sys.executable,
        'preprocess.py'
    ], cwd=scripts_dir):
        tests_passed.append("Data preprocessing")
    else:
        tests_failed.append("Data preprocessing")
        print("\n⚠️  Pipeline stopped due to failure")
        return False
    
    # Test 3: Train models
    print("\n[3/5] Training models...")
    if run_command([
        sys.executable,
        'train_screening.py'
    ], cwd=scripts_dir):
        tests_passed.append("Model training")
    else:
        tests_failed.append("Model training")
        print("\n⚠️  Training failed, continuing...")
    
    # Test 4: Evaluate models
    print("\n[4/5] Evaluating models...")
    if run_command([
        sys.executable,
        'evaluate.py'
    ], cwd=scripts_dir):
        tests_passed.append("Model evaluation")
        
        # Check metrics
        metrics_file = ml_dir / 'metrics' / 'eval_metrics.json'
        if metrics_file.exists():
            with open(metrics_file) as f:
                metrics = json.load(f)
            print("\nModel Performance:")
            for model_type, model_metrics in metrics.items():
                print(f"  {model_type}:")
                print(f"    F1: {model_metrics['f1_macro']:.4f}")
                print(f"    Accuracy: {model_metrics['accuracy']:.4f}")
                status = "PASSED" if model_metrics['thresholds_met'] else "NEEDS IMPROVEMENT"
                print(f"    Status: {status}")
    else:
        tests_failed.append("Model evaluation")
    
    # Test 5: Check artifacts
    print("\n[5/5] Checking artifacts...")
    required_files = [
        ml_dir / 'data' / 'raw' / 'synthetic_screenings.csv',
        ml_dir / 'data' / 'processed' / 'train_phq9.csv',
        ml_dir / 'data' / 'processed' / 'test_phq9.csv',
        ml_dir / 'models' / 'screening_phq9.pkl',
        ml_dir / 'metrics' / 'eval_metrics.json'
    ]
    
    all_exist = True
    for file in required_files:
        if file.exists():
            print(f"  ✅ {file.relative_to(ml_dir)}")
        else:
            print(f"  ❌ {file.relative_to(ml_dir)} - NOT FOUND")
            all_exist = False
    
    if all_exist:
        tests_passed.append("Artifact generation")
    else:
        tests_failed.append("Artifact generation")
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"Passed: {len(tests_passed)}")
    print(f"Failed: {len(tests_failed)}")
    
    if tests_passed:
        print("\n✅ Passed tests:")
        for test in tests_passed:
            print(f"  - {test}")
    
    if tests_failed:
        print("\n❌ Failed tests:")
        for test in tests_failed:
            print(f"  - {test}")
    
    print("="*60)
    
    if len(tests_failed) == 0:
        print("\n🎉 ALL TESTS PASSED!")
        return True
    else:
        print(f"\n⚠️  {len(tests_failed)} test(s) failed")
        return False


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
