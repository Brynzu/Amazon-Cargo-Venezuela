const fs = require('fs');

let logisticsContent = fs.readFileSync('src/lib/logistics.ts', 'utf8');

let rawData = JSON.parse(fs.readFileSync('../tealca_logistics.json', 'utf8'));

let seenCodes = new Set();
let cleanData = [];

rawData.reverse();

for (let item of rawData) {
  if (item.state !== "" && !seenCodes.has(item.postalCode)) {
    seenCodes.add(item.postalCode);
    cleanData.push(item);
  }
}

cleanData.reverse();

console.log(`Final count of clean Tealca offices: ${cleanData.length}`);

let regex = /export const tealcaData: CourierOffice\[\] = \[[\s\S]*?\];/s;
let newCode = 'export const tealcaData: CourierOffice[] = ' + JSON.stringify(cleanData, null, 2) + ';';

if (logisticsContent.match(regex)) {
  logisticsContent = logisticsContent.replace(regex, newCode);
  fs.writeFileSync('src/lib/logistics.ts', logisticsContent);
  console.log('Successfully replaced tealcaData in logistics.ts');
} else {
  console.log('Could not find regex match to replace');
}
