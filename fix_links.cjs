const fs = require('fs');
const path = require('path');

const dir = 'public';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const mappings = [
    { text: '대시보드', link: '/WMS_Dashboard.html' },
    { text: '재고 현황', link: '/Inventory_Status.html' },
    { text: '입고/출고', link: '/Inbound_Outbound_Logistics.html' },
    { text: '구매_BOM', link: '/Purchase_BOM_Management.html' }
];

files.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');

    let pieces = content.split('<a ');
    for (let i = 1; i < pieces.length; i++) {
        let piece = pieces[i];
        let endA = piece.indexOf('</a>');
        if (endA !== -1) {
            const anchorContent = piece.substring(0, endA);
            for (let m of mappings) {
                if (anchorContent.includes(m.text)) {
                    // Replace exactly the href="#" with the actual route
                    pieces[i] = piece.replace(/href="(#|[^"]*)"/, `href="${m.link}"`);
                    break;
                }
            }
        }
    }

    // also wrap the logo "SCM WMS" with a link back to Home (/)
    pieces = pieces.join('<a ');
    pieces = pieces.replace(/<h1([^>]*)>SCM WMS<\/h1>/, '<a href="/" style="text-decoration: none;"><h1$1>SCM WMS</h1></a>');

    fs.writeFileSync(path.join(dir, file), pieces);
});
console.log('Fixed navigation links in HTML files');
