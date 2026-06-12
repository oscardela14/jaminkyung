const fs = require('fs');
const https = require('https');
const path = require('path');

function download(url, dest) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            // Handle redirects manually
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                download(res.headers.location, dest).then(resolve).catch(reject);
                return;
            }
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to get '${url}' (${res.statusCode})`));
                return;
            }
            const file = fs.createWriteStream(dest);
            res.pipe(file);
            file.on('finish', () => { file.close(); resolve(); });
        }).on('error', (err) => { fs.unlink(dest, () => { }); reject(err); });
    });
}

async function processFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        return;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    let json;
    try {
        const rawMatch = data.match(/\{.*\}$/s) || data;
        json = JSON.parse(Array.isArray(rawMatch) ? rawMatch[0] : rawMatch);
    } catch (e) {
        console.error("Parse error for", filePath, e);
        return;
    }

    if (!json.outputComponents) return;

    for (const comp of json.outputComponents) {
        if (comp.design && comp.design.screens) {
            for (const s of comp.design.screens) {
                if (s.htmlCode && s.htmlCode.downloadUrl) {
                    const name = (s.title || 'Untitled').replace(/[^a-zA-Z0-9가-힣]/g, '_') + '.html';
                    const dest = path.join('public', name);
                    console.log(`Downloading ${s.title} to ${dest}...`);
                    try {
                        await download(s.htmlCode.downloadUrl, dest);
                        console.log(`SUCCESS: ${dest}`);
                    } catch (err) {
                        console.error(`FAILED: ${dest}`, err);
                    }
                }
            }
        }
    }
}

async function main() {
    if (!fs.existsSync('public')) fs.mkdirSync('public');
    await processFile('C:/Users/LYE/.gemini/antigravity/brain/56af020b-3432-43d3-9174-6995ac3ccd0b/.system_generated/steps/19/output.txt');
    await processFile('C:/Users/LYE/.gemini/antigravity/brain/56af020b-3432-43d3-9174-6995ac3ccd0b/.system_generated/steps/49/output.txt');
}

main();
