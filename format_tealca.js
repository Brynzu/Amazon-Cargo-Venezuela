const fs = require('fs');
let data = JSON.parse(fs.readFileSync('tealca_logistics.json', 'utf8'));

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

fs.writeFileSync('src/lib/logistics.ts', '\n// tealca_data_start\nconst tealcaData: CourierOffice[] = ' + JSON.stringify(cleanData, null, 2) + ';\n// tealca_data_end\n', {flag: 'a'});
console.log('Appended tealca data to logistics.ts');
