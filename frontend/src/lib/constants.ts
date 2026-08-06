export const DISEASE_CROPS = [
  'paddy',
  'pepper',
  'rubber',
  'coconut',
  'banana',
] as const

export const CROPS = [
  'paddy',
  'pepper',
  'rubber',
  'coconut',
  'banana',
  'tomato',
  'potato',
  'cassava',
  'tea',
  'coffee',
  'cardamom',
  'ginger',
  'turmeric',
  'corn',
  'cabbage',
  'cauliflower',
  'brinjal',
  'bhindi',
  'bitter gourd',
  'bottle gourd',
] as const

export const KERALA_DISTRICTS = [
  'Thiruvananthapuram',
  'Kollam',
  'Pathanamthitta',
  'Alappuzha',
  'Kottayam',
  'Idukki',
  'Ernakulam',
  'Thrissur',
  'Palakkad',
  'Malappuram',
  'Kozhikode',
  'Wayanad',
  'Kannur',
  'Kasaragod',
] as const

export const SOIL_TYPES = [
  'Laterite',
  'Alluvial',
  'Clay',
  'Sandy Loam',
  'Red Loam',
  'Coastal Sandy',
  'Forest/Hilly',
  'Black Cotton',
] as const

export const IRRIGATION_TYPES = [
  'Canal',
  'Borewell',
  'Rain-fed',
  'Drip',
  'Sprinkler',
  'Pond/Tank',
  'River-lift',
] as const

export const LANGUAGES = [
  { code: 'en', label: 'English',  flag: '🇬🇧' },
  { code: 'ml', label: 'മലയാളം', flag: '🇮🇳' },
  { code: 'hi', label: 'हिन्दी',   flag: '🇮🇳' },
  { code: 'ta', label: 'தமிழ்',   flag: '🇮🇳' },
  { code: 'kn', label: 'ಕನ್ನಡ',   flag: '🇮🇳' },
  { code: 'te', label: 'తెలుగు',  flag: '🇮🇳' },
] as const

export const CROP_EMOJIS: Record<string, string> = {
  paddy: '🌾',
  pepper: '🌶️',
  rubber: '🌳',
  coconut: '🥥',
  banana: '🍌',
  tomato: '🍅',
  potato: '🥔',
  rice: '🌾',
  cassava: '🌿',
  tea: '🍵',
  coffee: '☕',
  cardamom: '🌱',
  ginger: '🫚',
  turmeric: '🟡',
  corn: '🌽',
  cabbage: '🥬',
  cauliflower: '🥦',
  brinjal: '🍆',
  bhindi: '🫑',
  'bitter gourd': '🥒',
  'bottle gourd': '🫙',
}
