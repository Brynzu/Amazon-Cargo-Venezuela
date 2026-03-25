const https = require('https');
const fs = require('fs');

async function getStates() {
    return [
      {id: 807, name: 'Anzoátegui'},
      {id: 678, name: 'Aragua'},
      {id: 701, name: 'Barinas'},
      {id: 671, name: 'Bolívar'},
      {id: 682, name: 'Carabobo'},
      {id: 687, name: 'Cojedes'},
      {id: 740, name: 'D.Capital'},
      {id: 676, name: 'Delta Amacuro'},
      {id: 691, name: 'Falcón'},
      {id: 685, name: 'Guárico'},
      {id: 697, name: 'Lara'},
      {id: 710, name: 'Mérida'},
      {id: 651, name: 'Miranda'},
      {id: 669, name: 'Monagas'},
      {id: 657, name: 'Nueva Esparta'},
      {id: 689, name: 'Portuguesa'},
      {id: 660, name: 'Sucre'},
      {id: 703, name: 'Táchira'},
      {id: 708, name: 'Trujillo'},
      {id: 726, name: 'Vargas'},
      {id: 694, name: 'Yaracuy'},
      {id: 714, name: 'Zulia'}
    ];
}

https.get('https://www.tealca.com/wp-json/tealca-oficinas/v1/offices', async (resp) => {
  let data = '';
  resp.on('data', (chunk) => {
    data += chunk;
  });
  resp.on('end', async () => {
    const parsed = JSON.parse(data);
    const statesMap = await getStates();
    let output = [];

    parsed.data.forEach(item => {
      let stateName = "";
      for (let s of statesMap) {
        if (item.ubicaciones.includes(s.id)) {
          stateName = s.name;
          break;
        }
      }

      // Attempt to extract src from iframe map
      let mapUrl = "";
      if (item.fields.url_google_map && item.fields.url_google_map.includes('src="')) {
        mapUrl = item.fields.url_google_map.split('src="')[1].split('"')[0];
      }

      output.push({
        carrier: "Tealca",
        officeName: item.post.name,
        fullAddress: `Oficina ${item.post.name} (${item.fields.code})`,
        postalCode: item.fields.code, // using code as postal code/identifier
        mapUrl: mapUrl,
        state: stateName,
        city: item.post.name // fallback
      });
    });

    fs.writeFileSync('tealca_logistics.json', JSON.stringify(output, null, 2));
    console.log(`Saved ${output.length} offices`);
  });
});
