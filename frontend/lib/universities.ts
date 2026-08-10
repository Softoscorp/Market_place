export interface UniversityOption {
  value: string;
  city: string;
}

export const UNIVERSITIES_BY_CITY: { city: string; schools: string[] }[] = [
  {
    city: 'Famagusta (Gazimağusa)',
    schools: [
      'Eastern Mediterranean University (EMU)',
      'Istanbul Technical University TRNC Campus (ITU)',
      'Cyprus West University',
      'European Leadership University',
      'University of Mediterranean Karpasia',
    ],
  },
  {
    city: 'Nicosia (Lefkoşa)',
    schools: [
      'Near East University (NEU)',
      'Cyprus International University (CIU)',
      'Bahçeşehir Cyprus University (BAU)',
      'Cyprus Social Sciences University (KISBÜ)',
      'Akdeniz Karpaz University',
      'American University of Cyprus (AUC)',
      'Rauf Denktaş University',
      'Mesarya Technical University',
      'Onbeş Kasım Kıbrıs University',
    ],
  },
  {
    city: 'Kyrenia (Girne)',
    schools: [
      'Girne American University (GAU)',
      'University of Kyrenia',
      'Arkın University of Creative Arts and Design (ARUCAD)',
      'Cyprus Science University',
      'Final International University (FIU)',
      'Cyprus Aydın University',
    ],
  },
  {
    city: 'Morphou (Güzelyurt)',
    schools: [
      'Middle East Technical University Northern Cyprus Campus (METU)',
      'Cyprus Health and Social Sciences University (KSTU)',
    ],
  },
  {
    city: 'Lefke',
    schools: [
      'European University of Lefke (EUL)',
    ],
  },
];

export const ALL_UNIVERSITIES: string[] = UNIVERSITIES_BY_CITY.flatMap((group) => group.schools);

export function cityOfUniversity(school: string): string | undefined {
  const group = UNIVERSITIES_BY_CITY.find((g) => g.schools.includes(school));
  return group?.city;
}
