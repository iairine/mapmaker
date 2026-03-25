import type { FeatureCollection } from 'geojson';

export const GEOJSON_URLS = {
  world: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson',
  taiwan: 'https://raw.githubusercontent.com/g0v/twgeojson/master/json/twCounty2010.geo.json',
  'taiwan-town': '/taiwan-towns.geojson'
};

export async function fetchGeoJSON(region: string): Promise<FeatureCollection> {
  const url = GEOJSON_URLS[region as keyof typeof GEOJSON_URLS];
  if (!url) throw new Error('Invalid region');
  
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch geojson for ${region}`);
  return res.json();
}

export const DEFAULT_DATA = {
  world: "region_id,value\nUSA,100\nCHN,90\nJPN,80\nDEU,70\nGBR,60\nFRA,50\nIND,40\nITA,30\nBRA,20\nCAN,10\nAUS,50\nARG,35\nZAF,25",
  taiwan: "region_id,value\n臺北市,100\n新北市,90\n桃園市,80\n臺中市,70\n臺南市,60\n高雄市,50\n新竹縣,40\n苗栗縣,30\n彰化縣,20\n屏東縣,10\n花蓮縣,5\n臺東縣,5\n宜蘭縣,15",
  'taiwan-town': "region_id,value\n中正區,100\n大同區,90\n中山區,80\n松山區,70\n大安區,60\n萬華區,50\n信義區,40\n士林區,30\n北投區,20\n內湖區,10\n南港區,5\n文山區,5\n板橋區,15\n中和區,25"
};
