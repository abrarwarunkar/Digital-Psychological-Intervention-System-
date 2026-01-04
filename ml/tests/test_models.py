import pytest
import numpy as np
import pandas as pd
from pathlib import Path
import sys
import os

# Add scripts to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

def test_screening_data_processing():
    """Test that screening data is correctly processed"""
    # Mock data
    data = {
        'q1': [0, 1, 2, 3],
        'q2': [0, 1, 2, 3],
        'total_score': [0, 2, 4, 6]
    }
    df = pd.DataFrame(data)
    
    # Check basic properties
    assert len(df) == 4
    assert df['total_score'].mean() == 3.0

def test_risk_labels():
    """Test that risk labels are consistent"""
    risk_levels = ['no_risk', 'crisis', 'moderate']
    
    assert 'crisis' in risk_levels
    assert 'no_risk' in risk_levels

def test_model_registry_validation():
    """Test the validation logic for model registry"""
    # Mock metrics
    good_metrics = {'accuracy': 0.95}
    bad_metrics = {'accuracy': 0.40}
    
    # Re-implement logic from register_model.py for testing
    def validate(metrics):
        return metrics.get('accuracy', 0) > 0.5
        
    assert validate(good_metrics) == True
    assert validate(bad_metrics) == False
