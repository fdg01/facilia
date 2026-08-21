const http = require('http');
http.get('http://localhost:3000/facilia/api/dag', (res) => {
  const chunks = [];
  res.on('data', (chunk) => chunks.push(chunk));
  res.on('end', () => {
    const buf = Buffer.concat(chunks);
    const str = buf.toString('utf8');
    const idx = str.indexOf('continuity');
    if (idx > 0) {
      // Find the description after continuity
      const descIdx = str.indexOf('Insumos', idx);
      if (descIdx > 0) {
        const substr = str.substring(descIdx, descIdx + 40);
        console.log('Description:', substr);
        // Show bytes
        const byteIdx = buf.indexOf('Insumos');
        if (byteIdx > 0) {
          const bytes = buf.slice(byteIdx, byteIdx + 30);
          console.log('Bytes:', bytes.toString('hex'));
        }
      }
    }
  });
});
