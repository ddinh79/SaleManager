import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { translationService } from '../../services/translationService';
import { useI18nStore } from '../../store/i18nStore';
import { TranslationCell } from '../../components/admin/TranslationCell';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

const HUB_URL = '/hubs/translations';
const LOCALES = ['vi', 'en'];

export const I18nAdmin: React.FC = () => {
  const { translations, versions, setTranslations, updateTranslation, setError } = useI18nStore();
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocale, setSelectedLocale] = useState('vi');
  const [bulkMode, setBulkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const connectionRef = useRef<signalR.HubConnection | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [keysRes, translationsRes] = await Promise.all([
        translationService.getKeys(),
        translationService.getTranslations(selectedLocale),
      ]);
      setKeys(keysRes.keys);
      setTranslations(selectedLocale, translationsRes.data, translationsRes.version);
    } catch (err) {
      setError('Failed to load translations');
    } finally {
      setLoading(false);
    }
  }, [selectedLocale, setTranslations, setError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const connectSignalR = async () => {
      const connection = new signalR.HubConnectionBuilder()
        .withUrl(HUB_URL)
        .withAutomaticReconnect()
        .build();

      connection.on('TranslationUpdated', (data: any) => {
        if (data.locale === selectedLocale) {
          updateTranslation(selectedLocale, data.key, data.value);
        }
      });

      connection.on('TranslationBulkUpdated', (data: any) => {
        if (data.locale === selectedLocale) {
          loadData();
        }
      });

      connection.on('TranslationCreated', () => loadData());
      connection.on('TranslationDeleted', () => loadData());

      try {
        await connection.start();
      } catch (err) {
        console.warn('SignalR connection failed:', err);
      }

      connectionRef.current = connection;
    };

    connectSignalR();
    return () => { connectionRef.current?.stop(); };
  }, [selectedLocale, loadData, updateTranslation]);

  const filteredKeys = keys.filter(k =>
    k.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (key: string, locale: string, value: string) => {
    await translationService.updateTranslation(key, locale, value);
    updateTranslation(locale, key, value);
  };

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">i18n Admin</h1>
        <div className="flex gap-2">
          <Button variant={bulkMode ? 'primary' : 'secondary'} onClick={() => setBulkMode(!bulkMode)}>
            {bulkMode ? 'Single Edit' : 'Bulk Edit'}
          </Button>
        </div>
      </div>

      <div className="flex gap-4 items-center bg-white p-3 rounded-lg border">
        <div className="flex items-center gap-2">
          <label className="text-sm">Locale:</label>
          <select
            value={selectedLocale}
            onChange={(e) => setSelectedLocale(e.target.value)}
            className="px-3 py-1.5 border rounded"
          >
            {LOCALES.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
          </select>
        </div>
        <Input
          placeholder="Search keys..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        {versions[selectedLocale] && (
          <span className="text-sm text-slate-500">v{versions[selectedLocale]}</span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Key</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Category</th>
                {LOCALES.map(l => (
                  <th key={l} className="px-4 py-3 text-left text-sm font-semibold">{l.toUpperCase()}</th>
                ))}
                <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredKeys.map((item) => (
                <tr key={item.key} className={item.isDeleted ? 'bg-slate-100 opacity-50' : ''}>
                  <td className="px-4 py-2 font-mono text-sm">{item.key}</td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">{item.category}</span>
                  </td>
                  {LOCALES.map(l => (
                    <TranslationCell
                      key={l}
                      value={translations[l]?.[item.key] || ''}
                      onSave={(value) => handleSave(item.key, l, value)}
                      isMissing={!translations[l]?.[item.key]}
                    />
                  ))}
                  <td className="px-4 py-2">
                    <Button variant="danger" size="sm" onClick={() => translationService.deleteKey(item.key).then(loadData)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredKeys.length === 0 && (
            <div className="py-12 text-center text-slate-500">No keys found</div>
          )}
        </div>
      )}
    </div>
  );
};