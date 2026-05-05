import { create } from 'zustand';

interface I18nState {
  translations: Record<string, Record<string, string>>;
  versions: Record<string, number>;
  loading: boolean;
  error: string | null;
  setTranslations: (locale: string, data: Record<string, string>, version: number) => void;
  updateTranslation: (locale: string, key: string, value: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useI18nStore = create<I18nState>((set) => ({
  translations: {},
  versions: {},
  loading: false,
  error: null,

  setTranslations: (locale, data, version) =>
    set((state) => ({
      translations: { ...state.translations, [locale]: data },
      versions: { ...state.versions, [locale]: version },
    })),

  updateTranslation: (locale, key, value) =>
    set((state) => ({
      translations: {
        ...state.translations,
        [locale]: { ...state.translations[locale], [key]: value },
      },
    })),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));