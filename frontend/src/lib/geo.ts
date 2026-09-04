/**
 * Bangladesh Geolocation & Map Utilities
 * Provides Bangladesh-specific bounds, Google Maps tile layers, 
 * street-level geocoding search, and reverse geocoding.
 */

export const BANGLADESH_BOUNDS: [[number, number], [number, number]] = [
  [20.3, 87.8], // South-West (Bay of Bengal / Sundarbans)
  [26.8, 92.8]  // North-East (Sylhet / Tetulia)
];

export const DEFAULT_BD_CENTER: [number, number] = [23.8103, 90.4125]; // Dhaka Center

export const MAP_LAYERS = {
  googleStreets: {
    name: 'Google Streets',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=en',
    attribution: '&copy; Google Maps',
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
  },
  googleHybrid: {
    name: 'Google Satellite',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&hl=en',
    attribution: '&copy; Google Maps',
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
  },
  osm: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }
};

export type GeoCategory = 'street' | 'neighborhood' | 'building' | 'city' | 'poi' | 'location';

export interface GeoSearchResult {
  id: string | number;
  lat: number;
  lng: number;
  title: string;
  subtitle: string;
  category: GeoCategory;
  displayName: string;
  rawType?: string;
}

/**
 * Parses raw Nominatim result into a clean Bangladesh street/area result
 */
function parseNominatimResult(item: any): GeoSearchResult {
  const addr = item.address || {};
  const lat = parseFloat(item.lat);
  const lng = parseFloat(item.lon);

  const road = addr.road || addr.street || addr.footway || addr.path;
  const houseNumber = addr.house_number || addr.building;
  const neighborhood = addr.neighbourhood || addr.suburb || addr.quarter || addr.residential;
  const city = addr.city || addr.town || addr.municipality || addr.state_district || addr.county;
  const state = addr.state;
  const postcode = addr.postcode;

  let category: GeoCategory = 'location';
  let title = item.name || '';
  let subtitleParts: string[] = [];

  const itemType = item.addresstype || item.type || '';
  const itemClass = item.class || item.category || '';

  if (
    itemClass === 'highway' ||
    itemType === 'road' ||
    itemType === 'residential' ||
    itemType === 'secondary' ||
    itemType === 'tertiary' ||
    itemType === 'primary' ||
    itemType === 'trunk' ||
    itemType === 'motorway' ||
    itemType === 'living_street' ||
    itemType === 'service'
  ) {
    category = 'street';
    title = road || item.name || 'Street / Road';
    if (neighborhood) subtitleParts.push(neighborhood);
    if (city) subtitleParts.push(city);
    if (postcode) subtitleParts.push(postcode);
  } else if (
    itemClass === 'building' ||
    itemClass === 'amenity' ||
    itemClass === 'shop' ||
    itemClass === 'tourism' ||
    houseNumber
  ) {
    category = 'building';
    title = item.name || (houseNumber ? `${houseNumber}, ${road || ''}` : road || 'Building');
    if (road && !title.includes(road)) subtitleParts.push(road);
    if (neighborhood) subtitleParts.push(neighborhood);
    if (city) subtitleParts.push(city);
  } else if (
    itemType === 'suburb' ||
    itemType === 'neighbourhood' ||
    itemType === 'quarter' ||
    itemType === 'residential'
  ) {
    category = 'neighborhood';
    title = neighborhood || item.name || 'Neighborhood';
    if (city) subtitleParts.push(city);
    if (state) subtitleParts.push(state);
  } else if (
    itemType === 'city' ||
    itemType === 'town' ||
    itemType === 'administrative' ||
    itemType === 'county'
  ) {
    category = 'city';
    title = city || item.name || 'City';
    if (state) subtitleParts.push(state);
    subtitleParts.push('Bangladesh');
  } else {
    category = 'poi';
    title = item.name || item.display_name.split(',')[0] || 'Location';
    if (neighborhood) subtitleParts.push(neighborhood);
    if (city) subtitleParts.push(city);
  }

  // Fallback if title is empty
  if (!title) {
    const parts = (item.display_name || '').split(',');
    title = parts[0]?.trim() || 'Location';
    subtitleParts = parts.slice(1, 4).map((p: string) => p.trim());
  }

  const subtitle = subtitleParts.filter(Boolean).join(', ') || 'Bangladesh';

  return {
    id: item.place_id || `${lat}-${lng}`,
    lat,
    lng,
    title,
    subtitle,
    category,
    displayName: item.display_name || `${title}, ${subtitle}`,
    rawType: itemType
  };
}

/**
 * Search Bangladesh locations (streets, roads, neighborhoods, buildings, cities)
 */
export async function searchBangladeshLocations(query: string): Promise<GeoSearchResult[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const headers = { 'User-Agent': 'BiteSpeed-Food-Delivery-System/1.0' };
  const baseSearchUrl = (q: string) =>
    `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
      q
    )}&countrycodes=bd&addressdetails=1&limit=8&viewbox=87.8,20.3,92.8,26.8`;

  try {
    let res = await fetch(baseSearchUrl(cleanQuery), { headers });
    let data = await res.json();

    // If no results and query contains specific prefix like "House X", try searching the street/area directly
    if ((!data || data.length === 0) && /^(House|Flat|Apartment|Holding|Plot|Building|Apt)\b/i.test(cleanQuery)) {
      const fallbackQuery = cleanQuery.replace(
        /^(House|Flat|Apartment|Holding|Plot|Building|Apt)\s*[^,]+,\s*/i,
        ''
      );
      if (fallbackQuery && fallbackQuery !== cleanQuery) {
        res = await fetch(baseSearchUrl(fallbackQuery), { headers });
        data = await res.json();
      }
    }

    if (!Array.isArray(data)) return [];

    // Filter strictly to Bangladesh bounds
    const filtered = data.filter((item: any) => {
      const lat = parseFloat(item.lat);
      const lon = parseFloat(item.lon);
      return lat >= 20.3 && lat <= 26.8 && lon >= 87.8 && lon <= 92.8;
    });

    return filtered.map(parseNominatimResult);
  } catch (error) {
    console.error('Bangladesh location search failed:', error);
    return [];
  }
}

/**
 * Reverse geocode coordinates to structured Bangladesh address details
 */
export async function reverseGeocodeBangladesh(
  lat: number,
  lng: number
): Promise<{ displayName: string; shortAddress: string }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`,
      { headers: { 'User-Agent': 'BiteSpeed-Food-Delivery-System/1.0' } }
    );
    const data = await res.json();

    if (!data || !data.display_name) {
      return {
        displayName: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        shortAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      };
    }

    const addr = data.address || {};
    const road = addr.road || addr.street || addr.footway || addr.path;
    const houseNumber = addr.house_number || addr.building;
    const neighborhood = addr.neighbourhood || addr.suburb || addr.quarter;
    const city = addr.city || addr.town || addr.municipality || addr.state_district;
    const postcode = addr.postcode;

    const shortParts: string[] = [];
    if (houseNumber && road) {
      shortParts.push(`${houseNumber}, ${road}`);
    } else if (road) {
      shortParts.push(road);
    }
    if (neighborhood) shortParts.push(neighborhood);
    if (city) shortParts.push(city);
    if (postcode) shortParts.push(postcode);

    const shortAddress = shortParts.length > 0 ? shortParts.join(', ') : data.display_name.split(',').slice(0, 3).join(',');

    return {
      displayName: data.display_name,
      shortAddress
    };
  } catch (error) {
    console.error('Reverse geocode error:', error);
    return {
      displayName: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      shortAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    };
  }
}
