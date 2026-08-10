import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translations, Lang, TranslationKey } from '@/lib/i18n/translations';
import { getToken, API_BASE_URL } from '@/lib/api';

interface LanguageState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const makeT = (lang: Lang) => (key: TranslationKey, params?: Record<string, string | number>): string => {
  let text = translations[lang][key] ?? translations['en'][key];
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.split(`{${name}}`).join(String(value));
    }
  }
  return text;
};

async function syncLanguageToBackend(lang: Lang) {
  if (typeof window === 'undefined') return;
  const token = getToken();
  if (!token) return;
  try {
    await fetch(`${API_BASE_URL}/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ language: lang }),
    });
  } catch {
    // Language sync is best-effort; never break the UI over it.
  }
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      lang: 'en',
      setLang: (lang) => {
        set({ lang, t: makeT(lang) });
        syncLanguageToBackend(lang);
      },
      t: makeT('en'),
    }),
    {
      name: 'house-agent-lang',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setLang(state.lang);
        }
      },
    }
  )
);
