const fs = require('fs');
const content = fs.readFileSync('C:\\\\Users\\\\LYE\\\\.gemini\\\\antigravity\\\\brain\\\\3c723b52-841f-4714-ac5f-f5656f928d25\\\\.system_generated\\\\logs\\\\transcript.jsonl', 'utf8');

let idx = -1;
while (true) {
  idx = content.indexOf('// 2. 메인 대시보드 뷰 렌더링', idx + 1);
  if (idx === -1) break;
  console.log('MATCH AT:', idx);
  const snippet = content.substring(idx, idx + 4000);
  if (!snippet.includes('className="px-3 py-1.5         return (')) {
    console.log(snippet);
    break;
  }
}
