import { useEffect, useState } from 'react';
import notificationService from '../services/notificationService';

interface Settings {
  followUpReminderEnabled: boolean;
  dealClosingEnabled: boolean;
  inactiveAlertEnabled: boolean;
}

const NotificationSettingsPage = () => {
  const [settings, setSettings] = useState<Settings>({
    followUpReminderEnabled: true,
    dealClosingEnabled: true,
    inactiveAlertEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    notificationService.getSettings().then((res) => {
      setSettings(res);
      setLoading(false);
    });
  }, []);

  const handleToggle = async (key: keyof Settings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    setSaved(false);
    setSaving(true);
    try {
      await notificationService.updateSettings(newSettings);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Notification Settings</h1>

      <div className="bg-white rounded-xl shadow border border-slate-200 p-6">
        <p className="text-sm text-slate-500 mb-6">
          Control which notifications you receive. Changes are saved automatically.
        </p>

        <div className="space-y-4">
          {/* Follow-up Reminder */}
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <p className="font-medium text-slate-800">Follow-up Reminders</p>
              <p className="text-sm text-slate-500 mt-0.5">
                Get notified when your deals have no activity for 3 days
              </p>
            </div>
            <button
              onClick={() => handleToggle('followUpReminderEnabled')}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.followUpReminderEnabled ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.followUpReminderEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Deal Closing */}
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <p className="font-medium text-slate-800">Deal Closing Alerts</p>
              <p className="text-sm text-slate-500 mt-0.5">
                Get notified when deals are expected to close soon
              </p>
            </div>
            <button
              onClick={() => handleToggle('dealClosingEnabled')}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.dealClosingEnabled ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.dealClosingEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Inactive Alert */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-slate-800">Inactive Sales Alerts</p>
              <p className="text-sm text-slate-500 mt-0.5">
                Get notified when team members are inactive for 5+ days (Managers only)
              </p>
            </div>
            <button
              onClick={() => handleToggle('inactiveAlertEnabled')}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.inactiveAlertEnabled ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.inactiveAlertEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {saved && <p className="text-sm text-green-600 mt-4">Settings saved successfully</p>}
        {saving && <p className="text-sm text-slate-400 mt-4">Saving...</p>}
      </div>
    </div>
  );
};

const NotificationSettings = NotificationSettingsPage;

export { NotificationSettings };
export default NotificationSettingsPage;