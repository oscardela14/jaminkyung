const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', '안티', '0501', 'src', 'PurchaseAnalysis.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// 1-indexed line numbers from analysis:
// Remove lines 2115-2130: 서브탭 컨트롤 (0-indexed: 2114-2129)
// Remove line 2132: `{abcSubTab === 'abc' ? (` (0-indexed: 2131)
// Keep line 2133: `<>` (0-indexed: 2132) - already kept as first item after ABC open
// Remove lines 2341-2532: `) : (` through Kraljic closing `)}` (0-indexed: 2340-2531)
// Also remove abcSubTab state at line ~363 (search dynamically)

// Find the abcSubTab state line
let abcStateLineIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("const [abcSubTab, setAbcSubTab]")) {
    abcStateLineIdx = i;
    break;
  }
}

// Find sub-tab control start (서브 탭 컨트롤)
let subTabStart = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('서브 탭 컨트롤')) {
    subTabStart = i;
    break;
  }
}
// Find end of sub-tab control block (the </div> closing </div> at line 2130 = 0-indexed 2129)
// We know it ends with `            </div>` after the Kraljic button
let subTabEnd = -1;
for (let i = subTabStart; i < Math.min(subTabStart + 30, lines.length); i++) {
  // Look for `            </div>` which closes the outer flex container
  if (lines[i].trim() === '</div>' && lines[i + 1] && lines[i + 1].trim() === '') {
    subTabEnd = i;
    break;
  }
}

// Find `{abcSubTab === 'abc' ? (` line
let abcCondLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("{abcSubTab === 'abc' ? (")) {
    abcCondLine = i;
    break;
  }
}

// Find `) : (` that starts the Kraljic block (after ABC's <>)
// It should be around line 2341 (0-indexed 2340)
let kraljicStart = -1;
for (let i = abcCondLine; i < lines.length; i++) {
  if (lines[i].trim() === ') : (') {
    kraljicStart = i;
    break;
  }
}

// Find end of Kraljic block: look for `            )}` after the Kraljic content
// This is at line 2532 (0-indexed 2531)
let kraljicEnd = -1;
for (let i = kraljicStart; i < lines.length; i++) {
  if (lines[i].trim() === ')}' && lines[i-1] && lines[i-1].trim() === '</div>') {
    // Check next lines for `        )}` (abcAnalysis panel close)
    if (lines[i+1] && lines[i+1].trim() === '</div>') {
      kraljicEnd = i;
      break;
    }
  }
}

console.log(`abcStateLineIdx: ${abcStateLineIdx + 1}`);
console.log(`subTabStart: ${subTabStart + 1}`);
console.log(`subTabEnd: ${subTabEnd + 1}`);
console.log(`abcCondLine: ${abcCondLine + 1}`);
console.log(`kraljicStart: ${kraljicStart + 1}`);
console.log(`kraljicEnd: ${kraljicEnd + 1}`);

// Build new lines array
const newLines = [];
for (let i = 0; i < lines.length; i++) {
  // Skip abcSubTab state declaration
  if (i === abcStateLineIdx) continue;
  
  // Skip sub-tab control block (including the comment line)
  if (subTabStart !== -1 && subTabEnd !== -1 && i >= subTabStart && i <= subTabEnd) continue;
  
  // Skip `{abcSubTab === 'abc' ? (`  line
  if (i === abcCondLine) continue;
  
  // Skip Kraljic block: from `) : (` through its closing `)}` 
  if (kraljicStart !== -1 && kraljicEnd !== -1 && i >= kraljicStart && i <= kraljicEnd) continue;
  
  newLines.push(lines[i]);
}

const result = newLines.join('\n');
fs.writeFileSync(filePath, result, 'utf8');
console.log('Done! Lines removed successfully.');
console.log(`Original: ${lines.length} lines, New: ${newLines.length} lines`);
