import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translations, Lang, TranslationKey } from '@/lib/i18n/translations';

interface LanguageState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      lang: 'en',
      setLang: (lang) => set({ lang }),
      t: (key, params) => {
        let text = translations[get().lang][key] ?? translations['en'][key];
        if (params) {
          for (const [name, value] of Object.entries(params)) {
            text = text.split(`{${name}}`).join(String(value));
          }
        }
        return text;
      },
    }),
    { name: 'house-agent-lang' }
  )
);
