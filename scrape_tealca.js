const https = require('https');
https.get('https://www.tealca.com/wp-json/wp/v2/pages/2513', (resp) => {
  let data = '';
  resp.on('data', (chunk) => {
    data += chunk;
  });
  resp.on('end', () => {
    const json = JSON.parse(data);
    const content = json.content.rendered;
    const fs = require('fs');
    fs.writeFileSync('tealca_content.html', content);
    console.log('Saved to tealca_content.html');
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
