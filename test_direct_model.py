#!/usr/bin/env python3
"""
Test the model directly without API
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.models.model_factory import ModelFactory

print("🔬 Testing Model Directly")
print("=" * 60)

# Initialize model
factory = ModelFactory()
model = factory.get_model("v2")

if not model:
    print("❌ Failed to load model")
    exit(1)

print("✅ Model loaded successfully")

# Test cases
test_cases = [
    "My name is Ahmed and I live in Muscat",
    "John Smith works at Microsoft",
    "Contact me at john@example.com or 94216781",
    "I am from Oman"
]

for text in test_cases:
    print(f"\n📝 Testing: '{text}'")
    
    try:
        # Get predictions directly from model
        entities = model.predict(text)
        
        if entities:
            print(f"✅ Found {len(entities)} entities:")
            for entity in entities:
                print(f"   - {entity[0]} → {entity[1]} (pos: {entity[2]}-{entity[3]})")
        else:
            print("❌ No entities detected")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

print("\n" + "=" * 60)