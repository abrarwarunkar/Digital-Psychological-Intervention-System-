import json
from pathlib import Path

def test_load(path):
    print(f"Testing {path}...")
    try:
        with open(path, 'r') as f:
            data = json.load(f)
        print("✅ Valid JSON")
    except Exception as e:
        print(f"❌ Error: {e}")

base_dir = Path('ml')
responses_path = base_dir / 'data' / 'responses.json'
label_map_path = base_dir / 'models' / 'intent_classifier' / 'label_map.json'

test_load(responses_path)
test_load(label_map_path)
