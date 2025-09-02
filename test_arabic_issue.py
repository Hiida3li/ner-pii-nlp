#!/usr/bin/env python3
import requests
import json

text = "اسمي احمد الكندي من مسقط اعمل في بنك صحار ايميل Ahmed@gmail.com هاتف ٩٠٨٨٧٧٦٦ حساب ١٣٢٢٤٤٥٦٧ حساب ٥٤٤٨٧٦٥٣٢٤٥٨٩٧"

response = requests.post(
    'http://localhost:9000/api/extract',
    json={'text': text, 'model_version': 'v2'}
)

result = response.json()
print("Entities found:")
for e in result.get('entities', []):
    print(f"  {e['text']} → {e['entity_type']} (pos: {e['start']}-{e['end']})")

print("\nHighlighted text:")
print(result.get('highlighted_text', ''))