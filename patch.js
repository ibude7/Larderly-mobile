const fs = require('fs');
const file = '/Users/ibude/Larderly-mobile/src/screens/PantryScreen.tsx';
let content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');
const fixedLines = lines.slice(0, 416); // up to line 416
fixedLines.push('}');
fs.writeFileSync(file, fixedLines.join('\n'));
