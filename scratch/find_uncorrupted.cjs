const fs = require('fs');
const content = fs.readFileSync('C:\\\\Users\\\\LYE\\\\.gemini\\\\antigravity\\\\brain\\\\3c723b52-841f-4714-ac5f-f5656f928d25\\\\.system_generated\\\\logs\\\\transcript.jsonl', 'utf8');

const target = '초기화';
let idx = -1;
while (true) {
  idx = content.indexOf(target, idx + 1);
  if (idx === -1) break;
  console.log('MATCH AT:', idx);
  console.log(content.substring(idx - 100, idx + 200));
  console.log('-------------------');
}
