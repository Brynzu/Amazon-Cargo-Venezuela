const https = require('https');
const states = [807, 678, 701, 671, 682, 687, 740, 676, 691, 685, 697, 710, 651, 669, 657, 689, 660, 703, 708, 726, 694, 714];

async function getOffices(stateId) {
  return new Promise((resolve) => {
    // Let's try to pass the slug as that's often used in wordpress
    // From: <option value="807" data-slug="anzoategui-3" data-name="Anzoátegui">Anzoátegui</option>
    // We'll test with the first state
    const data = `action=get_cities&state=${stateId}`;
    const options = {
      hostname: 'www.tealca.com',
      path: '/wp-admin/admin-ajax.php',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, res => {
      let result = '';
      res.on('data', chunk => result += chunk);
      res.on('end', () => resolve(result));
    });
    req.write(data);
    req.end();
  });
}

async function scrape() {
  const html = await getOffices(807);
  console.log(`Action get_cities: ${html}`);
}
scrape();
