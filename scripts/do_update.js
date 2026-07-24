const fs = require('fs');
const path = require('path');

const tsxPath = path.join(__dirname, '..', 'app', 'foam', 'FoamPageClient.tsx');
const txtPath = path.join(__dirname, 'new_return.txt');

let content = fs.readFileSync(tsxPath, 'utf8');
const newReturn = fs.readFileSync(txtPath, 'utf8');

const returnIndex = content.indexOf('  return (');
if (returnIndex === -1) {
  console.error('Could not find return statement');
  process.exit(1);
}

const beforeReturn = content.substring(0, returnIndex);
fs.writeFileSync(tsxPath, beforeReturn + newReturn, 'utf8');
console.log('Successfully updated FoamPageClient.tsx');
