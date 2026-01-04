"""
Generate synthetic chat messages for risk detection training.

Creates realistic mental health conversation examples across 5 risk levels:
- emergency: Suicidal ideation, self-harm intent
- high: Severe distress, self-harm history
- medium: Moderate distress, hopelessness
- low: Mild symptoms, stress
- no-risk: General questions, normal conversation

Usage:
    python generate_synthetic_chats.py --n-samples 5000
"""

import pandas as pd
import numpy as np
from pathlib import Path
import argparse
from datetime import datetime

# Sample templates for each risk level
EMERGENCY_MESSAGES = [
    "I can't do this anymore. I just want it all to end.",
    "I've been thinking about ending my life. Nobody would miss me.",
    "I'm going to kill myself tonight. I can't take the pain anymore.",
    "Everyone would be better off without me. I'm done.",
    "I have pills ready. This is my goodbye.",
    "I don't want to wake up tomorrow.",
    "I'm planning to end it all this weekend.",
    "Life isn't worth living anymore. I've made my decision.",
    "I hurt myself badly tonight and don't want to stop.",
    "I'm going to jump. Nothing can change my mind.",
]

HIGH_RISK_MESSAGES = [
    "I hurt myself again last night. I don't know how to stop.",
    "Sometimes I feel like hurting myself is the only way to feel something.",
    "I've been cutting more frequently lately.",
    "The thoughts about harming myself won't go away.",
    "I don't trust myself to be alone right now.",
    "I keep thinking about ways to hurt myself.",
    "I've been self-harming for weeks and it's getting worse.",
    "I can't stop thinking about suicide but I'm scared.",
    "I've tried to hurt myself multiple times this month.",
    "I feel like I'm losing control and might hurt myself.",
]

MEDIUM_RISK_MESSAGES = [
    "I haven't left my bed in days. Everything feels hopeless.",
    "I'm so anxious I can barely breathe. It never stops.",
    "Nothing brings me joy anymore. I feel empty inside.",
    "I can't eat or sleep. My depression is overwhelming.",
    "I feel completely alone even when I'm with people.",
    "I don't see the point in anything anymore.",
    "My anxiety attacks are getting worse every day.",
    "I'm drowning in sadness and can't find a way out.",
    "I feel numb all the time. Like I'm not really here.",
    "The panic is constant. I don't know how much more I can take.",
]

LOW_RISK_MESSAGES = [
    "I've been feeling a bit down lately.",
    "School stress has been getting to me.",
    "I'm having trouble sleeping because of anxiety.",
    "I feel overwhelmed with everything going on.",
    "I've been more irritable than usual.",
    "My mood has been low for a few weeks.",
    "I'm feeling stressed about exams.",
    "I don't have much energy lately.",
    "I'm worried about my mental health.",
    "I feel sad sometimes but I'll be okay.",
]

NO_RISK_MESSAGES = [
    "What are some good stress management techniques?",
    "How do I book an appointment with a counselor?",
    "Can you recommend some mental health resources?",
    "What services do you offer for students?",
    "I'd like to learn more about mindfulness.",
    "Do you have any tips for better sleep?",
    "What are the signs of anxiety?",
    "How can I support a friend who's struggling?",
    "Are there any support groups on campus?",
    "What's the difference between therapy and counseling?",
]

# Intent categories
INTENT_MAPPING = {
    'emergency': 'crisis',
    'high': 'escalate',
    'medium': 'emotional_support',
    'low': 'emotional_support',
    'no-risk': 'faq'
}

def generate_variations(template_messages, n_samples):
    """Generate variations of template messages"""
    messages = []
    variations = [
        lambda s: s,
        lambda s: s.lower(),
        lambda s: s + " Please help.",
        lambda s: "I need to talk. " + s,
        lambda s: s + " I don't know what to do.",
        lambda s: f"Feeling: {s}",
        lambda s: s.replace("I'm", "I am"),
        lambda s: s.replace(".", "..."),
        lambda s: s + " Can anyone help?",
        lambda s: "Honestly, " + s.lower(),
    ]
    
    while len(messages) < n_samples:
        template = np.random.choice(template_messages)
        variation = np.random.choice(variations)
        messages.append(variation(template))
    
    return messages[:n_samples]


def generate_chat_dataset(n_samples=5000, distribution=None):
    """
    Generate synthetic chat dataset.
    
    Args:
        n_samples: Total number of samples
        distribution: Dict of risk_level -> proportion (defaults to balanced)
    
    Returns:
        pandas DataFrame
    """
    if distribution is None:
        # Default distribution (more normal messages, fewer emergencies)
        distribution = {
            'no-risk': 0.40,
            'low': 0.30,
            'medium': 0.15,
            'high': 0.10,
            'emergency': 0.05
        }
    
    # Calculate samples per category
    samples_per_category = {
        risk: int(n_samples * prop)
        for risk, prop in distribution.items()
    }
    
    # Adjust for rounding
    total = sum(samples_per_category.values())
    if total < n_samples:
        samples_per_category['no-risk'] += (n_samples - total)
    
    records = []
    
    # Generate emergency messages
    print(f"Generating {samples_per_category['emergency']} emergency messages...")
    emergency_msgs = generate_variations(EMERGENCY_MESSAGES, samples_per_category['emergency'])
    for msg in emergency_msgs:
        records.append({
            'message': msg,
            'risk_level': 'emergency',
            'intent': 'crisis',
            'timestamp': datetime.now()
        })
    
    # Generate high risk messages
    print(f"Generating {samples_per_category['high']} high-risk messages...")
    high_msgs = generate_variations(HIGH_RISK_MESSAGES, samples_per_category['high'])
    for msg in high_msgs:
        records.append({
            'message': msg,
            'risk_level': 'high',
            'intent': 'escalate',
            'timestamp': datetime.now()
        })
    
    # Generate medium risk messages
    print(f"Generating {samples_per_category['medium']} medium-risk messages...")
    medium_msgs = generate_variations(MEDIUM_RISK_MESSAGES, samples_per_category['medium'])
    for msg in medium_msgs:
        records.append({
            'message': msg,
            'risk_level': 'medium',
            'intent': 'emotional_support',
            'timestamp': datetime.now()
        })
    
    # Generate low risk messages
    print(f"Generating {samples_per_category['low']} low-risk messages...")
    low_msgs = generate_variations(LOW_RISK_MESSAGES, samples_per_category['low'])
    for msg in low_msgs:
        records.append({
            'message': msg,
            'risk_level': 'low',
            'intent': 'emotional_support',
            'timestamp': datetime.now()
        })
    
    # Generate no-risk messages
    print(f"Generating {samples_per_category['no-risk']} no-risk messages...")
    safe_msgs = generate_variations(NO_RISK_MESSAGES, samples_per_category['no-risk'])
    for msg in safe_msgs:
        # Vary intents for no-risk messages
        intent = np.random.choice(['faq', 'resource_request', 'booking_request'], p=[0.6, 0.2, 0.2])
        records.append({
            'message': msg,
            'risk_level': 'no-risk',
            'intent': intent,
            'timestamp': datetime.now()
        })
    
    df = pd.DataFrame(records)
    
    # Shuffle
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    return df


def main():
    parser = argparse.ArgumentParser(description='Generate synthetic chat messages')
    parser.add_argument('--n-samples', type=int, default=5000, help='Number of samples to generate')
    parser.add_argument('--output', default='data/raw/synthetic_chats.csv', help='Output file')
    parser.add_argument('--seed', type=int, default=42, help='Random seed')
    
    args = parser.parse_args()
    
    # Set seed
    np.random.seed(args.seed)
    
    # Generate data
    print(f"Generating {args.n_samples} synthetic chat messages...")
    df = generate_chat_dataset(args.n_samples)
    
    # Save
    script_dir = Path(__file__).parent
    output_path = script_dir.parent / args.output
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)
    
    print(f"\n✅ Generated {len(df)} messages")
    print(f"Saved to: {output_path.absolute()}")
    print(f"\nBreakdown:")
    print(df.groupby(['risk_level', 'intent']).size())
    
    # Statistics
    print(f"\nRisk Level Distribution:")
    print(df['risk_level'].value_counts())
    print(f"\nIntent Distribution:")
    print(df['intent'].value_counts())


if __name__ == '__main__':
    main()
