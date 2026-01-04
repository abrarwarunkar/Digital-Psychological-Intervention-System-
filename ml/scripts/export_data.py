"""
Export screening and chat data from MongoDB to CSV/JSONL for ML training.

Usage:
    python export_data.py --output-dir ../data/raw --consent-only

Features:
    - Filters by user consent
    - Anonymizes user IDs
    - Masks PII using Presidio
    - Exports screenings to CSV, chats to JSONL
"""

import os
import sys
import argparse
import hashlib
import pandas as pd
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from pymongo import MongoClient
from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine

# Load environment
load_dotenv()

# MongoDB connection
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/student-mental-health')

# PII detection
analyzer = AnalyzerEngine()
anonymizer = AnonymizerEngine()


def hash_id(user_id):
    """Hash user ID for anonymization"""
    return hashlib.sha256(str(user_id).encode()).hexdigest()[:16]


def mask_pii(text):
    """Mask PII in text using Presidio"""
    if not text or not isinstance(text, str):
        return text
    
    try:
        results = analyzer.analyze(text=text, language='en')
        anonymized = anonymizer.anonymize(text=text, analyzer_results=results)
        return anonymized.text
    except Exception as e:
        print(f"PII masking error: {e}")
        return text


def export_screenings(db, output_dir, consent_only=True):
    """Export PHQ-9/GAD-7 screening results to CSV"""
    print("Exporting screening data...")
    
    # Get users with ML consent
    consent_filter = {"mlDataConsent.screening.granted": True} if consent_only else {}
    consented_users = list(db.users.find(consent_filter, {"_id": 1}))
    user_ids = [u['_id'] for u in consented_users]
    
    print(f"Found {len(user_ids)} consented users")
    
    # Fetch screening results
    screenings = list(db.screeningresults.find({"userId": {"$in": user_ids}}))
    
    if not screenings:
        print("No screening data found")
        return
    
    # Transform to DataFrame
    records = []
    for s in screenings:
        record = {
            'user_hash': hash_id(s['userId']),
            'type': s['type'],
            'score': s['score'],
            'answers': str(s['answers']),  # Store as string for CSV
            'risk_level': s.get('riskLevel', 'unknown'),
            'timestamp': s['createdAt']
        }
        records.append(record)
    
    df = pd.DataFrame(records)
    
    # Save to CSV
    output_path = Path(output_dir) / 'screenings.csv'
    df.to_csv(output_path, index=False)
    print(f"Saved {len(df)} screening records to {output_path}")
    
    return df


def export_chat_logs(db, output_dir, consent_only=True):
    """Export chat messages to JSONL"""
    print("Exporting chat logs...")
    
    # Get users with ML consent
    consent_filter = {"mlDataConsent.chatLogs.granted": True} if consent_only else {}
    consented_users = list(db.users.find(consent_filter, {"_id": 1}))
    user_ids = [u['_id'] for u in consented_users]
    
    print(f"Found {len(user_ids)} consented users for chat")
    
    # Fetch chat logs
    messages = list(db.chatlogs.find({"userId": {"$in": user_ids}}))
    
    if not messages:
        print("No chat data found")
        return
    
    # Transform and mask PII
    records = []
    for msg in messages:
        record = {
            'user_hash': hash_id(msg['userId']),
            'message': mask_pii(msg['message']),
            'sender': msg['sender'],
            'timestamp': msg['timestamp'].isoformat() if isinstance(msg['timestamp'], datetime) else str(msg['timestamp'])
        }
        records.append(record)
    
    df = pd.DataFrame(records)
    
    # Save to JSONL
    output_path = Path(output_dir) / 'chat_logs.jsonl'
    df.to_json(output_path, orient='records', lines=True)
    print(f"Saved {len(df)} chat messages to {output_path}")
    
    return df


def main():
    parser = argparse.ArgumentParser(description='Export ML training data from MongoDB')
    parser.add_argument('--output-dir', default='../data/raw', help='Output directory')
    parser.add_argument('--consent-only', action='store_true', default=True, 
                       help='Only export data from users who consented')
    parser.add_argument('--skip-screenings', action='store_true', help='Skip screening export')
    parser.add_argument('--skip-chats', action='store_true', help='Skip chat export')
    
    args = parser.parse_args()
    
    # Create output directory
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Connect to MongoDB
    print(f"Connecting to MongoDB: {MONGO_URI}")
    client = MongoClient(MONGO_URI)
    db = client.get_database()
    
    # Export data
    if not args.skip_screenings:
        export_screenings(db, output_dir, args.consent_only)
    
    if not args.skip_chats:
        export_chat_logs(db, output_dir, args.consent_only)
    
    print("\n✅ Export complete!")
    print(f"Data saved to: {output_dir.absolute()}")


if __name__ == '__main__':
    main()
