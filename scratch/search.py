import re

with open('src/PurchaseAnalysis.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '거래처' in line or '개사' in line or '조회' in line:
        print(f"{i+1}: {line.strip()}")
