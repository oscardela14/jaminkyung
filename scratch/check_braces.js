
import fs from 'fs';
const content = fs.readFileSync('src/CosmeticsBOM.tsx', 'utf8');

const counts = {
    '{': 0, '}': 0,
    '(': 0, ')': 0,
    '[': 0, ']': 0,
    '<': 0, '>': 0
};

for (let char of content) {
    if (counts[char] !== undefined) {
        counts[char]++;
    }
}

console.log(counts);
