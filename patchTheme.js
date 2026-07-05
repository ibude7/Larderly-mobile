const fs = require('fs');
const file = '/Users/ibude/Larderly-mobile/src/theme.ts';
let content = fs.readFileSync(file, 'utf8');

// Replace "as const"
content = content.replace(/\} as const;/g, '};');

// Enforce blurTint type
content = content.replace(/blurTint: 'light',/g, "blurTint: 'light' as 'light' | 'dark' | 'default',");
content = content.replace(/blurTint: 'dark',/g, "blurTint: 'dark' as 'light' | 'dark' | 'default',");

fs.writeFileSync(file, content);
