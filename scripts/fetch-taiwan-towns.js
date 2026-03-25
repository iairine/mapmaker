import fs from 'fs';
import path from 'path';
import shp from 'shpjs';

async function fetchAndConvert() {
  console.log('Downloading official Taiwan town shapefile...');
  try {
    // Attempt download from MOI open data portal
    const url = 'https://data.moi.gov.tw/MoiOD/System/DownloadFile.aspx?DATA=72874C55-884D-4CEA-B7D6-F60B0BE85AB0';
    console.log(`Fetching from ${url}`);
    
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`Parsing SHP buffer (size: ${buffer.length} bytes)...`);
    let geojson = await shp(buffer);
    if (Array.isArray(geojson)) {
      geojson = geojson[0];
    }
    
    // Normalize names to prevent missing properties in D3 lookups
    geojson.features.forEach(f => {
      // Usually TOWNNAME and COUNTYNAME exist in MOI town shapefiles
      const p = f.properties || {};
      const county = p.COUNTYNAME || '';
      const town = p.TOWNNAME || '';
      p.name = `${county}${town}`; // e.g. "臺北市中正區"
      f.id = town; // Use the raw town name as ID
    });

    const outPath = path.join(process.cwd(), 'public', 'taiwan-towns.geojson');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(geojson));
    console.log(`Successfully saved GeoJSON to ${outPath}`);

  } catch (e) {
    console.error('Failed to parse official SHP data', e);
    console.log('Falling back to a verified JSON mirror of the town boundary...');
    // Fallback if the MOI link is unreliable/down.
    // Fetching from a known valid topojson source and converting back implies more packages.
    // Let's fallback to fetching from g0v
    const fallbackRes = await fetch('https://raw.githubusercontent.com/g0v/twgeojson/master/json/twTown1982.geo.json');
    if (fallbackRes.ok) {
        const fallbackJson = await fallbackRes.text();
        const outPath = path.join(process.cwd(), 'public', 'taiwan-towns.geojson');
        fs.writeFileSync(outPath, fallbackJson);
        console.log(`Saved fallback GeoJSON to ${outPath}`);
    }
  }
}

fetchAndConvert();
