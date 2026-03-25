import type { FeatureCollection } from 'geojson';

export const GEOJSON_URLS = {
  world: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson',
  taiwan: 'https://raw.githubusercontent.com/g0v/twgeojson/master/json/twCounty2010.geo.json',
  'taiwan-town': `${import.meta.env.BASE_URL}taiwan-towns.geojson`
};

export async function fetchGeoJSON(region: string): Promise<FeatureCollection> {
  const url = GEOJSON_URLS[region as keyof typeof GEOJSON_URLS];
  if (!url) throw new Error('Invalid region');
  
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch geojson for ${region}`);
  return res.json();
}

export const DEFAULT_DATA = {
  world: "Area,Value\nAfghanistan,654000\nAlgeria,313.12\nAngola,48340\nArgentina,1264770\nAustralia,619180\nAzerbaijan,15290.57\nBangladesh,60570453.05\nBelgium,0",
  taiwan: "縣市名稱,數值\n新北市,4044831\n臺北市,2439507\n桃園市,2355106\n臺中市,2868465\n臺南市,1852477\n高雄市,2718545",
  'taiwan-town': "鄉鎮市名稱,數值\n雲林縣/斗六市,108225\n雲林縣/斗南鎮,43115\n雲林縣/虎尾鎮,71204\n雲林縣/西螺鎮,44212\n雲林縣/土庫鎮,27421\n雲林縣/北港鎮,37115"
};
