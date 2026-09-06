const fs = require('fs');
let task = fs.readFileSync('C:/Users/WELCOME/.gemini/antigravity/brain/cc9c6d48-83df-4193-932f-7d5cef748fd8/task.md', 'utf-8');

task = task.replace('- [ ] Implement Backend Controller/Logic', '- [x] Implement Backend Controller/Logic');

fs.writeFileSync('C:/Users/WELCOME/.gemini/antigravity/brain/cc9c6d48-83df-4193-932f-7d5cef748fd8/task.md', task, 'utf-8');
console.log('Updated tasks');
