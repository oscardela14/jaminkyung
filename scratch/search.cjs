const fs = require('fs');

const content = fs.readFileSync('src/PurchaseAnalysis.tsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('거래처') || line.includes('개사') || line.includes('조회')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
