import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translations, Lang, TranslationKey } from '@/lib/i18n/translations';

interface LanguageState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      lang: 'en',
      setLang: (lang) => set({ lang }),
      t: (key) => translations[get().lang][key] ?? translations['en'][key],
    }),
    { name: 'house-agent-lang' }
  )
);
