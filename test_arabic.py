#!/usr/bin/env python3
"""
Test Arabic text detection
"""

import requests
import json

def test_detection(text):
    """Test entity detection via API"""
    print(f"\n📝 Testing: '{text}'")
    
    response = requests.post(
        'http://localhost:9000/api/extract',
        json={'text': text, 'model_version': 'v2'}
    )
    
    if response.status_code == 200:
        result = response.json()
        entities = result.get('entities', [])
        
        if entities:
            print(f"✅ Found {len(entities)} entities:")
            for e in entities:
                print(f"   - {e['text']} → {e['entity_type']}")
        else:
            print("❌ No entities detected")
        
        # Check highlighted text
        highlighted = result.get('highlighted_text', '')
        if 'ss=' in highlighted or 'style=' in highlighted and '<span' not in highlighted[:6]:
            print("⚠️  WARNING: Broken HTML in highlighted text")
            print(f"   {highlighted[:100]}...")
        
        return result
    else:
        print(f"❌ API Error: {response.status_code}")
        return None

print("🔬 Testing Arabic Text Detection")
print("=" * 60)

# Test Arabic text from user
arabic_text = "اسمي احمد الكندي من مسقط اعمل في بنك صحار ايميل Ahmed@gmail.com هاتف ٩٠٨٨٧٧٦٦ حساب ١٣٢٢٤٤٥٦٧"

result = test_detection(arabic_text)

print("\n" + "=" * 60)

# Test mixed Arabic/English
mixed_text = "اسمي Ahmed من Muscat والايميل john@example.com"
result = test_detection(mixed_text)

print("\n" + "=" * 60)

# Test simple Arabic
simple_arabic = "احمد في مسقط"
result = test_detection(simple_arabic)

print("\n✨ Test completed!")