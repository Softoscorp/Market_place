export interface University {
  id: string;
  name: string;
  abbreviation: string;
  city: string;
  lat: number;
  lng: number;
  studentCount: string;
  color: string;
}

export const universities: University[] = [
  {
    id: 'emu',
    name: 'Eastern Mediterranean University',
    abbreviation: 'EMU',
    city: 'Famagusta',
    lat: 35.1456,
    lng: 33.9106,
    studentCount: '18,000+',
    color: '#1e40af',
  },
  {
    id: 'neu',
    name: 'Near East University',
    abbreviation: 'NEU',
    city: 'Nicosia',
    lat: 35.2280,
    lng: 33.3220,
    studentCount: '26,000+',
    color: '#b91c1c',
  },
  {
    id: 'ciu',
    name: 'Cyprus International University',
    abbreviation: 'CIU',
    city: 'Nicosia',
    lat: 35.2477,
    lng: 33.3485,
    studentCount: '16,000+',
    color: '#0e7490',
  },
  {
    id: 'gau',
    name: 'Girne American University',
    abbreviation: 'GAU',
    city: 'Kyrenia',
    lat: 35.3375,
    lng: 33.3180,
    studentCount: '9,000+',
    color: '#7c3aed',
  },
  {
    id: 'eul',
    name: 'European University of Lefke',
    abbreviation: 'EUL',
    city: 'Lefke',
    lat: 35.1133,
    lng: 32.8519,
    studentCount: '8,000+',
    color: '#047857',
  },
  {
    id: 'fiu',
    name: 'Final International University',
    abbreviation: 'FIU',
    city: 'Kyrenia',
    lat: 35.3415,
    lng: 33.3123,
    studentCount: '4,000+',
    color: '#dc2626',
  },
  {
    id: 'arucad',
    name: 'ARUCAD',
    abbreviation: 'ARUCAD',
    city: 'Kyrenia',
    lat: 35.3370,
    lng: 33.3200,
    studentCount: '1,500+',
    color: '#ea580c',
  },
  {
    id: 'bau',
    name: 'Bahçeşehir Cyprus University',
    abbreviation: 'BAU',
    city: 'Nicosia',
    lat: 35.1950,
    lng: 33.3640,
    studentCount: '4,000+',
    color: '#0369a1',
  },
  {
    id: 'uok',
    name: 'University of Kyrenia',
    abbreviation: 'UoK',
    city: 'Kyrenia',
    lat: 35.3356,
    lng: 33.3125,
    studentCount: '3,000+',
    color: '#4338ca',
  },
  {
    id: 'aku',
    name: 'Ada Kent University',
    abbreviation: 'AKU',
    city: 'Kyrenia',
    lat: 35.3380,
    lng: 33.3190,
    studentCount: '1,500+',
    color: '#166534',
  },
];

export const cities = [
  { id: 'famagusta', name: 'Famagusta', nameLocal: 'Gazimağusa' },
  { id: 'nicosia', name: 'Nicosia', nameLocal: 'Lefkoşa' },
  { id: 'kyrenia', name: 'Kyrenia', nameLocal: 'Girne' },
  { id: 'lefke', name: 'Lefke', nameLocal: 'Lefke' },
  { id: 'iskele', name: 'Iskele', nameLocal: 'İskele' },
  { id: 'guzelyurt', name: 'Güzelyurt', nameLocal: 'Güzelyurt' },
];

export const neighborhoods: Record<string, string[]> = {
  famagusta: ['Sakarya', 'Baykal', 'Gülseren', 'Karakol', 'Çanakkale', 'Lala Mustafa Paşa', 'Yeni Boğaziçi', 'Tuzla'],
  nicosia: ['Gönyeli', 'Küçük Kaymaklı', 'Ortaköy', 'Hamitköy', 'Marmara', 'Değirmenlik', 'Haspolat', 'Alayköy'],
  kyrenia: ['Alsancak', 'Lapta', 'Karaoğlanoğlu', 'Çatalköy', 'Ozanköy', 'Bellapais', 'Doğanköy', 'Esentepe'],
  lefke: ['Gemikonağı', 'Yeşilırmak', 'Cengizköy', 'Bağlıköy'],
  iskele: ['Bogaz', 'Long Beach', 'Mehmetçik', 'Yeni Erenköy', 'Kaplıca'],
  guzelyurt: ['Serhatköy', 'Bostancı', 'Akçay'],
};
