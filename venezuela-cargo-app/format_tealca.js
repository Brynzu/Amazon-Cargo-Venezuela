const fs = require('fs');
let data = JSON.parse(fs.readFileSync('../tealca_logistics.json', 'utf8'));

// Filter out duplicates and empty states
let seenCodes = new Set();
let cleanData = [];

// Reverse so newer IDs (usually valid state ones) are processed first
data.reverse();

for (let item of data) {
  if (item.state !== "" && !seenCodes.has(item.postalCode)) {
    seenCodes.add(item.postalCode);
    cleanData.push(item);
  }
}

cleanData.reverse(); // Back to original sort

let tsContent = fs.readFileSync('src/lib/logistics.ts', 'utf8');
tsContent = tsContent.replace('export const logisticsData: CourierOffice[] = [', 'export const tealcaData: CourierOffice[] = ' + JSON.stringify(cleanData, null, 2) + ';\n\nexport const logisticsData: CourierOffice[] = [\n  ...tealcaData,');

fs.writeFileSync('src/lib/logistics.ts', tsContent);
console.log(`Appended ${cleanData.length} tealca offices to logistics.ts`);
