import api from './api';

export interface BulkTranslationChange {
  key: string;
  value: string;
}

export interface I18nResponse {
  version: number;
  locale: string;
  data: Record<string, string>;
}

export interface TranslationKeyResponse {
  key: string;
  category: string;
  description?: string;
  isDeleted: boolean;
}

export const translationService = {
  getTranslations: async (locale: string, ns?: string): Promise<I18nResponse> => {
    const params: Record<string, string> = { locale };
    if (ns) params.ns = ns;
    const response = await api.get('/i18n', { params });
    return response.data;
  },

  getKeys: async (): Promise<{ keys: TranslationKeyResponse[] }> => {
    const response = await api.get('/i18n/keys');
    return response.data;
  },

  getMissingKeys: async (locale: string): Promise<TranslationKeyResponse[]> => {
    const response = await api.get('/i18n/missing', { params: { locale } });
    return response.data;
  },

  updateTranslation: async (
    key: string,
    locale: string,
    value: string,
    expectedVersion?: number
  ): Promise<any> => {
    const response = await api.put(`/i18n/${encodeURIComponent(key)}`, {
      locale,
      value,
      expectedVersion,
    });
    return response.data;
  },

  createKey: async (data: {
    key: string;
    category: string;
    description?: string;
    initialValues?: Record<string, string>;
  }): Promise<TranslationKeyResponse> => {
    const response = await api.post('/i18n', data);
    return response.data;
  },

  bulkUpdate: async (locale: string, changes: BulkTranslationChange[]): Promise<{ updated: number }> => {
    const response = await api.post('/i18n/bulk', { locale, changes });
    return response.data;
  },

  deleteKey: async (key: string): Promise<void> => {
    await api.delete(`/i18n/${encodeURIComponent(key)}`);
  },

  logMissing: async (key: string, locale: string): Promise<void> => {
    await api.post('/i18n/missing-log', { key, locale });
  },
};